import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Voucher } from '@/lib/types';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  return email.replace(/^(.).+(@.+)$/, '$1***$2');
}

function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  const todayStart = startOfDay(new Date()).toISOString();
  const weekStart = startOfDay(new Date(Date.now() - 6 * 86400000)).toISOString();

  // Pull all the data we need in parallel.
  const [
    { count: totalRedeemed },
    { count: todayRedeemed },
    { count: todayIssued },
    { data: weekVouchers },
    { data: recent },
    { count: locationCount },
    { count: menuCount },
  ] = await Promise.all([
    supabase
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'redeemed'),
    supabase
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'redeemed')
      .gte('redeemed_at', todayStart),
    supabase
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'issued')
      .gte('issued_at', todayStart),
    supabase
      .from('vouchers')
      .select('issued_at, redeemed_at, status')
      .eq('restaurant_id', restaurant.id)
      .gte('issued_at', weekStart)
      .order('issued_at', { ascending: true }),
    supabase
      .from('vouchers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('issued_at', { ascending: false })
      .limit(10),
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
  ]);

  // Build a 7-day trend (issued + redeemed) for the bar chart.
  const days: { label: string; issued: number; redeemed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(new Date(Date.now() - i * 86400000));
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      issued: 0,
      redeemed: 0,
    });
  }
  for (const v of (weekVouchers ?? []) as { issued_at: string; redeemed_at: string | null; status: string }[]) {
    const issued = startOfDay(new Date(v.issued_at)).getTime();
    const idx = days.findIndex(
      (d, i) => startOfDay(new Date(Date.now() - (6 - i) * 86400000)).getTime() === issued,
    );
    if (idx >= 0) {
      days[idx].issued += 1;
      if (v.status === 'redeemed') days[idx].redeemed += 1;
    }
  }
  const maxBar = Math.max(1, ...days.map((d) => d.issued));

  const onboardingIncomplete = (locationCount ?? 0) === 0 || (menuCount ?? 0) === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl text-ink-900">Welcome back</h1>
        <p className="mt-2 text-ink-600">
          Here&rsquo;s how things are looking at <span className="font-medium text-ink-900">{restaurant.name}</span> today.
        </p>
      </header>

      {/* Onboarding banner */}
      {onboardingIncomplete && (
        <div className="rounded-3xl border border-accent-200 bg-accent-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl text-ink-900">Finish your setup</h2>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                Your public listing won&rsquo;t go live until you add at least one location and one menu item.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${(locationCount ?? 0) > 0 ? 'bg-brand-600 text-white' : 'border border-ink-300 bg-white'}`}>
                    {(locationCount ?? 0) > 0 ? '✓' : ''}
                  </span>
                  <span className={(locationCount ?? 0) > 0 ? 'text-ink-700 line-through' : 'text-ink-800'}>
                    Add your first location
                  </span>
                  {(locationCount ?? 0) === 0 && (
                    <Link href="/partner/dashboard/locations" className="ml-auto text-brand-700 font-medium hover:text-brand-800">
                      Add now →
                    </Link>
                  )}
                </li>
                <li className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${(menuCount ?? 0) > 0 ? 'bg-brand-600 text-white' : 'border border-ink-300 bg-white'}`}>
                    {(menuCount ?? 0) > 0 ? '✓' : ''}
                  </span>
                  <span className={(menuCount ?? 0) > 0 ? 'text-ink-700 line-through' : 'text-ink-800'}>
                    Add at least one menu item
                  </span>
                  {(menuCount ?? 0) === 0 && (
                    <Link href="/partner/dashboard/menu" className="ml-auto text-brand-700 font-medium hover:text-brand-800">
                      Add now →
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total meals served" value={totalRedeemed ?? 0} tone="brand" />
        <StatCard label="Redeemed today" value={todayRedeemed ?? 0} tone="accent" />
        <StatCard label="Outstanding today" value={todayIssued ?? 0} tone="ink" />
      </div>

      {/* Trend + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink-900">This week</h2>
            <span className="text-xs text-ink-500">Vouchers issued (last 7 days)</span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2 h-44">
            {days.map((d, i) => {
              const issuedHeight = (d.issued / maxBar) * 100;
              const redeemedHeight = (d.redeemed / maxBar) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex flex-col items-center justify-end h-32">
                    <div
                      className="w-6 sm:w-8 rounded-t-md bg-brand-200 relative"
                      style={{ height: `${Math.max(issuedHeight, d.issued > 0 ? 4 : 0)}%` }}
                      title={`${d.issued} issued`}
                    >
                      {d.redeemed > 0 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-md bg-brand-600"
                          style={{ height: `${(d.redeemed / d.issued) * 100}%` }}
                          title={`${d.redeemed} redeemed`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-ink-500">{d.label}</span>
                  <span className="text-xs font-medium text-ink-700">{d.issued}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-brand-600 inline-block" /> Redeemed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-brand-200 inline-block" /> Issued
            </span>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-900">Quick actions</h2>
          <div className="mt-5 space-y-2">
            <Link href="/partner/dashboard/scan" className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50 transition-colors">
              <span className="font-medium text-ink-800">Scan voucher</span>
              <span className="text-brand-600">→</span>
            </Link>
            <Link href="/partner/dashboard/menu" className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50 transition-colors">
              <span className="font-medium text-ink-800">Add menu item</span>
              <span className="text-brand-600">→</span>
            </Link>
            <Link href="/partner/dashboard/locations" className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50 transition-colors">
              <span className="font-medium text-ink-800">Add location</span>
              <span className="text-brand-600">→</span>
            </Link>
            <Link href="/partner/dashboard/settings" className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50 transition-colors">
              <span className="font-medium text-ink-800">Edit profile</span>
              <span className="text-brand-600">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink-900">Recent activity</h2>
          <Link href="/partner/dashboard/vouchers" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="divide-y divide-ink-100">
            {(recent as Voucher[]).map((v) => (
              <li key={v.id} className="px-6 py-4 flex items-center gap-4">
                <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(v.status)}`}>
                  {v.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {v.menu_item_name} · <span className="font-mono text-xs text-ink-600">{v.code}</span>
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 truncate">
                    {maskEmail(v.email)} · issued {fmtTime(v.issued_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-ink-500 text-sm">
            No vouchers yet — once a guest claims one, you&rsquo;ll see them here.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'accent' | 'ink' }) {
  const toneClasses =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-800'
      : tone === 'accent'
      ? 'bg-accent-50 text-accent-800'
      : 'bg-ink-50 text-ink-800';
  return (
    <div className="card p-6">
      <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums text-ink-900">{value.toLocaleString()}</p>
      <span className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses}`}>
        {tone === 'brand' ? 'all-time' : tone === 'accent' ? 'today' : 'pending'}
      </span>
    </div>
  );
}

function statusClasses(status: string) {
  switch (status) {
    case 'redeemed':
      return 'bg-brand-100 text-brand-800';
    case 'issued':
      return 'bg-accent-100 text-accent-800';
    case 'expired':
      return 'bg-ink-100 text-ink-700';
    case 'voided':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-ink-100 text-ink-700';
  }
}
