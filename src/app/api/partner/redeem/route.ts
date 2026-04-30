import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Body = {
  code?: string;
  confirm?: boolean;
};

function publicVoucher(v: {
  id: string;
  code: string;
  email: string;
  menu_item_name: string;
  status: string;
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
}) {
  return {
    id: v.id,
    code: v.code,
    email: v.email,
    menu_item_name: v.menu_item_name,
    status: v.status,
    issued_at: v.issued_at,
    expires_at: v.expires_at,
    redeemed_at: v.redeemed_at,
  };
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: 'error', message: 'Not authenticated.' },
      { status: 401 },
    );
  }

  // Make sure the caller owns a restaurant.
  const { data: restaurant, error: restErr } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (restErr || !restaurant) {
    return NextResponse.json(
      { ok: false, code: 'error', message: 'No restaurant found for this account.' },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'error', message: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json(
      { ok: false, code: 'error', message: 'Missing code.' },
      { status: 400 },
    );
  }

  // Look up the voucher.
  // Owner RLS only allows reading vouchers for the owner's restaurant — so a
  // voucher belonging to a different restaurant will simply not be found by
  // this query. We don't reveal which restaurant it belongs to.
  const { data: voucher, error: vErr } = await supabase
    .from('vouchers')
    .select('id, code, email, menu_item_name, status, issued_at, expires_at, redeemed_at, restaurant_id')
    .eq('code', code)
    .maybeSingle();

  if (vErr) {
    return NextResponse.json(
      { ok: false, code: 'error', message: vErr.message },
      { status: 500 },
    );
  }

  if (!voucher) {
    // Could be: doesn't exist, OR exists for a different restaurant (RLS hides it).
    // We can't distinguish here without a service-role client, but the user-facing
    // message intentionally treats both cases the same to avoid leaking info.
    return NextResponse.json(
      {
        ok: false,
        code: 'not_found',
        message: 'Voucher not found or not valid for this restaurant.',
      },
      { status: 404 },
    );
  }

  if (voucher.restaurant_id !== restaurant.id) {
    return NextResponse.json(
      { ok: false, code: 'wrong_restaurant', message: 'Voucher not valid here.' },
      { status: 403 },
    );
  }

  if (voucher.status === 'redeemed') {
    return NextResponse.json(
      {
        ok: false,
        code: 'already_redeemed',
        message: 'Voucher has already been redeemed.',
        voucher: publicVoucher(voucher),
      },
      { status: 409 },
    );
  }

  if (voucher.status === 'expired' || new Date(voucher.expires_at) < new Date()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'expired',
        message: 'Voucher has expired.',
        voucher: publicVoucher(voucher),
      },
      { status: 410 },
    );
  }

  if (voucher.status !== 'issued') {
    return NextResponse.json(
      {
        ok: false,
        code: 'error',
        message: `Voucher is in status "${voucher.status}".`,
        voucher: publicVoucher(voucher),
      },
      { status: 409 },
    );
  }

  // If client only wants a preview, return the voucher without changing it.
  if (!body.confirm) {
    return NextResponse.json(
      { ok: true, voucher: publicVoucher(voucher), redeemed: false },
      { status: 200 },
    );
  }

  // Confirmed — perform the update.
  const { data: updated, error: updErr } = await supabase
    .from('vouchers')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: user.id,
    })
    .eq('id', voucher.id)
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'issued') // optimistic: don't double-redeem
    .select('id, code, email, menu_item_name, status, issued_at, expires_at, redeemed_at')
    .maybeSingle();

  if (updErr) {
    return NextResponse.json(
      { ok: false, code: 'error', message: updErr.message },
      { status: 500 },
    );
  }
  if (!updated) {
    // Race: someone else redeemed it between our lookup and update.
    return NextResponse.json(
      {
        ok: false,
        code: 'already_redeemed',
        message: 'Voucher was redeemed just now.',
        voucher: publicVoucher(voucher),
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { ok: true, voucher: publicVoucher(updated), redeemed: true },
    { status: 200 },
  );
}
