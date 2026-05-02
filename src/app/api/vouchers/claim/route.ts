import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { generateVoucherCode, voucherExpiry } from '@/lib/voucher';
import { generateVoucherPdf } from '@/lib/pdf';
import { sendVoucherEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ClaimSchema = z.object({
  restaurant_id: z.string().uuid(),
  menu_item_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  _hp: z.string().optional(),
});

function getClientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://freehalalmeal.com'
  );
}

/**
 * Returns true if `now` (in UTC) falls within the location's available window.
 * TODO: Make this timezone-aware per location (use IANA tz name on the location row).
 * For now we use UTC and trust the restaurant set hours appropriately for their region.
 */
function withinHours(
  loc: {
    available_days: number[];
    available_from: string;
    available_until: string;
  },
  now: Date,
) {
  const dow = now.getUTCDay();
  if (!loc.available_days?.includes(dow)) return false;
  const [fh, fm] = loc.available_from.split(':').map(Number);
  const [uh, um] = loc.available_until.split(':').map(Number);
  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minsFrom = fh * 60 + (fm ?? 0);
  const minsUntil = uh * 60 + (um ?? 0);
  return minsNow >= minsFrom && minsNow <= minsUntil;
}

function fakeCode() {
  // Returned to bots so they don't iterate; not stored, not valid.
  return `HAL-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Please check the form and try again.' },
      { status: 400 },
    );
  }
  const { restaurant_id, menu_item_id, location_id, email, _hp } = parsed.data;

  // Honeypot — pretend success so bots move on.
  if (_hp && _hp.trim().length > 0) {
    const code = fakeCode();
    return NextResponse.json({
      ok: true,
      code,
      expires_at: voucherExpiry().toISOString(),
      voucher_url: `${siteUrl()}/voucher/${code}`,
    });
  }

  const ip = getClientIp(req);
  const supabase = createServiceClient();

  // Block-list checks
  const { data: blockedEmail } = await supabase
    .from('blocked_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  if (blockedEmail) {
    return NextResponse.json(
      { ok: false, error: 'This email is not eligible to claim vouchers.' },
      { status: 403 },
    );
  }
  if (ip) {
    const { data: blockedIp } = await supabase
      .from('blocked_ips')
      .select('ip')
      .eq('ip', ip)
      .maybeSingle();
    if (blockedIp) {
      return NextResponse.json(
        { ok: false, error: 'This network is not eligible to claim vouchers.' },
        { status: 403 },
      );
    }

    // Per-IP rate limit: cap claims per hour per IP. The honeypot + per-day-
    // per-email-per-restaurant unique constraint defends against naive bots,
    // but a determined attacker rotating emails could still flood the DB or
    // exhaust the email-provider quota. Counting recent claims by IP via the
    // existing vouchers table avoids a new dependency (no Redis/KV needed).
    // Limit is generous enough for shared-IP scenarios (families, libraries).
    const RATE_LIMIT_PER_IP_PER_HOUR = 10;
    const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentByIp } = await supabase
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgoIso);
    if ((recentByIp ?? 0) >= RATE_LIMIT_PER_IP_PER_HOUR) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Too many claims from this network in the last hour. Please try again later.',
        },
        { status: 429 },
      );
    }
  }

  // Restaurant — must be active. We also pull the scheduled-pause window and
  // monthly cap here in the same round-trip so the checks below don't need a
  // second query against the restaurants table.
  const { data: restaurant, error: rErr } = await supabase
    .from('restaurants')
    .select('id, name, status, monthly_meal_limit, paused_from, paused_until')
    .eq('id', restaurant_id)
    .maybeSingle();
  if (rErr || !restaurant || restaurant.status !== 'active') {
    return NextResponse.json(
      { ok: false, error: 'This restaurant is not currently accepting claims.' },
      { status: 404 },
    );
  }

  // Single `now` for the whole request: every time-based check below (pause
  // window, monthly cap, hours, voucher expiry) reads from the same instant
  // so a long-running request can't straddle e.g. a month boundary and give
  // inconsistent answers.
  const now = new Date();

  // Scheduled-pause check. Restaurants can set a future pause window without
  // having an admin flip status to 'paused' at the exact moment — we enforce
  // the schedule on every request instead of mutating restaurant.status, so
  // the pause auto-lifts when paused_until passes (no cron / no stale state).
  // Either bound being NULL means open-ended on that side.
  const pausedFrom = restaurant.paused_from ? new Date(restaurant.paused_from) : null;
  const pausedUntil = restaurant.paused_until ? new Date(restaurant.paused_until) : null;
  const afterStart = pausedFrom === null || now >= pausedFrom;
  const beforeEnd = pausedUntil === null || now <= pausedUntil;
  // Only treat as paused if at least one bound is set — both NULL means no
  // pause is scheduled at all (the row's defaults), not "paused forever".
  if ((pausedFrom !== null || pausedUntil !== null) && afterStart && beforeEnd) {
    return NextResponse.json(
      { ok: false, error: 'This restaurant is currently paused. Please try again later.' },
      { status: 423 },
    );
  }

  // Monthly meal cap (across all of this restaurant's locations). Distinct
  // from the per-location daily_meal_limit below: lets a restaurant cap their
  // total monthly commitment regardless of how many locations they operate.
  // NULL means unlimited (don't even run the count query in that case).
  if (restaurant.monthly_meal_limit !== null) {
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const { count: issuedThisMonth } = await supabase
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant_id)
      .gte('created_at', startOfMonth.toISOString());
    if ((issuedThisMonth ?? 0) >= restaurant.monthly_meal_limit) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'This restaurant has reached its monthly meal cap. Please come back next month.',
        },
        { status: 429 },
      );
    }
  }

  // Menu item — must belong to restaurant + active
  const { data: menuItem, error: mErr } = await supabase
    .from('menu_items')
    .select('id, name, restaurant_id, is_active')
    .eq('id', menu_item_id)
    .maybeSingle();
  if (
    mErr ||
    !menuItem ||
    menuItem.restaurant_id !== restaurant_id ||
    !menuItem.is_active
  ) {
    return NextResponse.json(
      { ok: false, error: 'That meal is no longer available.' },
      { status: 404 },
    );
  }

  // Location — optional but if provided must belong + be active.
  let location: {
    id: string;
    label: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    region: string | null;
    postal_code: string | null;
    country: string;
    available_days: number[];
    available_from: string;
    available_until: string;
    daily_meal_limit: number;
    is_active: boolean;
    restaurant_id: string;
  } | null = null;

  if (location_id) {
    const { data: locRow } = await supabase
      .from('locations')
      .select(
        'id, label, address_line1, address_line2, city, region, postal_code, country, available_days, available_from, available_until, daily_meal_limit, is_active, restaurant_id',
      )
      .eq('id', location_id)
      .maybeSingle();
    if (!locRow || locRow.restaurant_id !== restaurant_id || !locRow.is_active) {
      return NextResponse.json(
        { ok: false, error: 'That location is not currently available.' },
        { status: 404 },
      );
    }
    location = locRow;
  } else {
    // Pick the first active location for the restaurant
    const { data: locRow } = await supabase
      .from('locations')
      .select(
        'id, label, address_line1, address_line2, city, region, postal_code, country, available_days, available_from, available_until, daily_meal_limit, is_active, restaurant_id',
      )
      .eq('restaurant_id', restaurant_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!locRow) {
      return NextResponse.json(
        { ok: false, error: 'This restaurant has no active locations.' },
        { status: 404 },
      );
    }
    location = locRow;
  }

  // Hours check (UTC-approximate — see TODO above). `now` was captured
  // earlier alongside the pause/monthly checks so all time-based checks in
  // this request agree on a single instant.
  if (!withinHours(location, now)) {
    // Don't hard-block — many restaurants may set generous windows. We surface a
    // gentle warning but still issue (voucher is valid 48h regardless).
    // (Intentionally no return here.)
  }

  // Today's voucher count for restaurant + location
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
  );
  const { count: issuedToday, error: countErr } = await supabase
    .from('vouchers')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant_id)
    .eq('location_id', location.id)
    .in('status', ['issued', 'redeemed'])
    .gte('issued_at', startOfDay.toISOString());

  if (countErr) {
    console.error('[claim] count error', countErr);
  }
  if ((issuedToday ?? 0) >= location.daily_meal_limit) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Sorry, this restaurant has reached today's free meal limit. Please try again tomorrow or pick another restaurant.",
      },
      { status: 429 },
    );
  }

  // Generate voucher
  const code = generateVoucherCode();
  const expiresAt = voucherExpiry(now);

  const { data: inserted, error: insertErr } = await supabase
    .from('vouchers')
    .insert({
      code,
      email,
      ip_address: ip,
      restaurant_id,
      location_id: location.id,
      menu_item_id,
      menu_item_name: menuItem.name,
      status: 'issued',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, code, expires_at')
    .single();

  if (insertErr) {
    // Unique violation = duplicate today
    if (insertErr.code === '23505') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'You already claimed a voucher from this restaurant today. Please come back tomorrow.',
        },
        { status: 409 },
      );
    }
    console.error('[claim] insert error', insertErr);
    return NextResponse.json(
      { ok: false, error: 'Could not issue your voucher. Please try again.' },
      { status: 500 },
    );
  }

  const voucherUrl = `${siteUrl()}/voucher/${inserted.code}`;
  // Build a single-line postal-style address: street, city + region + postal, country.
  // The inner join groups region + postal_code with a single space ("ON M5C 1W4")
  // so the outer comma-join doesn't put a comma between them.
  const cityRegion = [
    location.city,
    [location.region, location.postal_code].filter(Boolean).join(' ').trim(),
  ]
    .filter(Boolean)
    .join(', ');
  const addressBits = [
    location.address_line1,
    location.address_line2,
    cityRegion,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Generate PDF + email — failures here don't invalidate the voucher.
  try {
    const pdfBytes = await generateVoucherPdf({
      voucherCode: inserted.code,
      restaurantName: restaurant.name,
      menuItemName: menuItem.name,
      locationLabel: location.label,
      locationAddress: addressBits,
      expiresAt,
      redeemUrl: voucherUrl,
    });

    await sendVoucherEmail({
      to: email,
      voucherCode: inserted.code,
      restaurantName: restaurant.name,
      menuItemName: menuItem.name,
      expiresAt,
      voucherUrl,
      pdfBuffer: Buffer.from(pdfBytes),
    });
  } catch (e) {
    console.error('[claim] email/pdf failed but voucher is valid:', e);
  }

  return NextResponse.json({
    ok: true,
    code: inserted.code,
    expires_at: inserted.expires_at,
    voucher_url: voucherUrl,
  });
}
