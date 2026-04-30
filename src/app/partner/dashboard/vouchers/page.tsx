import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Voucher, VoucherStatus } from '@/lib/types';
import { MarkRedeemedButton } from './MarkRedeemedButton';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const STATUSES: (VoucherStatus | 'all')[] = ['all', 'issued', 'redeemed', 'expired', 'voided'];

function maskEmail(email: string): string {
  return email.replace(/^(.).+(@.+)$/, '$1***$2');
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusClasses(status: string) {
  switch (status) {
    case 'redeemed': return 'bg-brand-100 text-brand-800';
    case 'issued': return 'bg-accent-100 text-accent-800';
    case 'expired': return 'bg-ink-100 text-ink-700';
    case 'voided': return 'bg-red-100 text-red-700';
    default: return 'bg-ink-100 text-ink-700';
  }
}

type SearchParams = {
  status?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function VouchersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  const status = (searchParams.status ?? 'all') as VoucherStatus | 'all';
  const from = searchParams.from ?? '';
  const to = searchParams.to ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let q = supabase
    .from('vouchers')
    .select('*', { count: 'exact' })
    .eq('restaurant_id', restaurant.id)
    .order('issued_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status !== 'all') q = q.eq('status', status);
  if (from) q = q.gte('issued_at', new Date(from).toISOString());
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    q = q.lte('issued_at', end.toISOString());
  }

  const { data: vouchers, count } = await q;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Locations & menu items maps for richer rows
  const [{ data: locs }, { data: menus }] = await Promise.all([
    supabase.from('locations').select('id, label').eq('restaurant_id', restaurant.id),
    supabase.from('menu_items').select('id, name').eq('restaurant_id', restaurant.id),
  ]);
  const locMap = new Map((locs ?? []).map((l) => [l.id, l.label]));
  const menuMap = new Map((menus ?? []).map((m) => [m.id, m.name]));

  const baseQuery = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (status !== 'all') sp.set('status', status);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const qs = sp.toString();
    return `/partner/dashboard/vouchers${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl text-ink-900">Vouchers</h1>
        <p className="mt-2 text-ink-600">Every voucher claimed for your restaurant.</p>
      </header>

      {/* Filters */}
      <form className="card p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr,auto,auto,auto] sm:items-end" method="get">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={baseQuery({ status: s === 'all' ? '' : s, page: '' })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="from">From</label>
          <input id="from" type="date" name="from" defaultValue={from} className="input py-2" />
        </div>
        <div>
          <label className="label" htmlFor="to">To</label>
          <input id="to" type="date" name="to" defaultValue={to} className="input py-2" />
        </div>
        <div className="flex gap-2">
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="btn-primary">Filter</button>
          {(from || to) && (
            <Link href={baseQuery({ from: '', to: '', page: '' })} className="btn-outline">
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Results */}
      <div className="card overflow-x-auto">
        {vouchers && vouchers.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Meal</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Issued</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(vouchers as Voucher[]).map((v) => (
                <tr key={v.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-mono text-xs text-ink-800">{v.code}</td>
                  <td className="px-4 py-3 text-ink-700">{maskEmail(v.email)}</td>
                  <td className="px-4 py-3 text-ink-800">
                    {v.menu_item_name || (v.menu_item_id ? menuMap.get(v.menu_item_id) : '—')}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {v.location_id ? (locMap.get(v.location_id) ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{fmt(v.issued_at)}</td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{fmt(v.expires_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.status === 'issued' && new Date(v.expires_at) > new Date() ? (
                      <MarkRedeemedButton id={v.id} />
                    ) : v.status === 'redeemed' ? (
                      <span className="text-xs text-ink-500">{fmt(v.redeemed_at)}</span>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-ink-500 text-sm">
            No vouchers match these filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-ink-500">
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={baseQuery({ page: String(page - 1) })} className="btn-outline">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={baseQuery({ page: String(page + 1) })} className="btn-outline">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
