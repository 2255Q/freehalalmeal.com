import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { setRestaurantStatus } from './actions';

export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClasses = {
    default: 'text-ink-900',
    good: 'text-brand-700',
    warn: 'text-accent-600',
    bad: 'text-red-600',
  }[tone];
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${toneClasses}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'bg-brand-50 text-brand-700',
    pending: 'bg-accent-100 text-accent-700',
    suspended: 'bg-red-50 text-red-700',
    issued: 'bg-ink-100 text-ink-700',
    redeemed: 'bg-brand-50 text-brand-700',
    expired: 'bg-ink-100 text-ink-500',
    voided: 'bg-red-50 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        classes[status] ?? 'bg-ink-100 text-ink-700'
      }`}
    >
      {status}
    </span>
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ''}*@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [
    { count: restaurantsTotal },
    { count: restaurantsActive },
    { count: restaurantsPending },
    { count: restaurantsSuspended },
    { count: locationsTotal },
    { count: menuItemsTotal },
    { count: vouchersTotal },
    { count: vouchersIssued },
    { count: vouchersRedeemed },
    { count: vouchersExpired },
    { count: blockedEmailsCount },
    { count: blockedIpsCount },
    { data: mealsServedRpc },
    { data: recentVouchers },
    { data: distinctEmailRows },
    { data: pendingRestaurants },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('menu_items').select('*', { count: 'exact', head: true }),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'redeemed'),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('blocked_emails').select('*', { count: 'exact', head: true }),
    supabase.from('blocked_ips').select('*', { count: 'exact', head: true }),
    supabase.rpc('meals_served_total'),
    supabase
      .from('vouchers')
      .select('id, code, email, status, issued_at, restaurant_id, restaurants(name)')
      .order('issued_at', { ascending: false })
      .limit(20),
    supabase.from('vouchers').select('email'),
    supabase
      .from('restaurants')
      .select('id, name, slug, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const uniqueEmails = new Set((distinctEmailRows ?? []).map((r: { email: string }) => r.email.toLowerCase())).size;

  // Top 10 restaurants by redeemed vouchers — done in JS to avoid bespoke SQL.
  const { data: redeemedRows } = await supabase
    .from('vouchers')
    .select('restaurant_id, restaurants(name)')
    .eq('status', 'redeemed');

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of (redeemedRows ?? []) as Array<{ restaurant_id: string; restaurants: { name: string } | null }>) {
    const id = row.restaurant_id;
    const name = row.restaurants?.name ?? '(unknown)';
    const cur = counts.get(id);
    if (cur) cur.count += 1;
    else counts.set(id, { name, count: 1 });
  }
  const topRestaurants = Array.from(counts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // RPC returns bigint -> serialized as number|string|null. Normalize to number.
  const mealsServed: number = (() => {
    const v = mealsServedRpc as number | string | null | undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    return 0;
  })();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">Overview</h1>
        <p className="text-sm text-ink-500">
          Live snapshot of the platform. All counts include suspended and inactive items.
        </p>
      </header>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Restaurants
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={restaurantsTotal ?? 0} />
          <StatCard label="Active" value={restaurantsActive ?? 0} tone="good" />
          <StatCard label="Pending" value={restaurantsPending ?? 0} tone="warn" />
          <StatCard label="Suspended" value={restaurantsSuspended ?? 0} tone="bad" />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Inventory
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Locations" value={locationsTotal ?? 0} />
          <StatCard label="Menu items" value={menuItemsTotal ?? 0} />
          <StatCard label="Unique users" value={uniqueEmails} hint="distinct voucher emails" />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Vouchers
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total issued" value={vouchersTotal ?? 0} />
          <StatCard label="Outstanding" value={vouchersIssued ?? 0} />
          <StatCard label="Redeemed" value={vouchersRedeemed ?? 0} tone="good" />
          <StatCard label="Expired" value={vouchersExpired ?? 0} />
          <StatCard
            label="Meals served"
            value={mealsServed}
            tone="good"
            hint="from meals_served_total()"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Abuse control
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Blocked emails" value={blockedEmailsCount ?? 0} tone="bad" />
          <StatCard label="Blocked IPs" value={blockedIpsCount ?? 0} tone="bad" />
        </div>
      </section>

      {(pendingRestaurants?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Pending restaurants
          </h2>
          <div className="card divide-y divide-ink-100">
            {(pendingRestaurants ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/restaurants/${r.id}`}
                    className="font-medium text-ink-900 hover:text-brand-700"
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {r.email} · created {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      'use server';
                      await setRestaurantStatus(r.id, 'active');
                    }}
                  >
                    <button className="btn-primary text-xs px-3 py-1.5">Approve</button>
                  </form>
                  <form
                    action={async () => {
                      'use server';
                      await setRestaurantStatus(r.id, 'suspended');
                    }}
                  >
                    <button className="btn-outline text-xs px-3 py-1.5">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Recent vouchers
          </h2>
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_1.2fr_1.5fr_0.7fr_1fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
              <span>Code</span>
              <span>Email</span>
              <span>Restaurant</span>
              <span>Status</span>
              <span>Issued</span>
            </div>
            <div className="divide-y divide-ink-100">
              {(recentVouchers ?? []).length === 0 && (
                <div className="p-6 text-sm text-ink-500">No vouchers yet.</div>
              )}
              {(recentVouchers ?? []).map((v) => {
                const r = (v as unknown as { restaurants: { name: string } | null }).restaurants;
                return (
                  <div
                    key={v.id}
                    className="md:grid md:grid-cols-[1fr_1.2fr_1.5fr_0.7fr_1fr] md:gap-2 p-3 md:px-4 md:py-2 text-sm flex flex-col gap-1"
                  >
                    <span className="font-mono text-xs text-ink-700">{v.code}</span>
                    <span className="text-ink-700 truncate">{maskEmail(v.email)}</span>
                    <span className="text-ink-700 truncate">{r?.name ?? '—'}</span>
                    <span><StatusBadge status={v.status} /></span>
                    <span className="text-ink-500 text-xs">{formatDate(v.issued_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Top restaurants (by meals served)
          </h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-ink-100">
              {topRestaurants.length === 0 && (
                <div className="p-6 text-sm text-ink-500">No redemptions yet.</div>
              )}
              {topRestaurants.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/admin/restaurants/${r.id}`}
                  className="flex items-center justify-between p-3 px-4 hover:bg-ink-50"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-ink-400 w-5">#{i + 1}</span>
                    <span className="text-sm font-medium text-ink-800 truncate">{r.name}</span>
                  </span>
                  <span className="text-sm font-semibold text-brand-700">{r.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

