import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { voidVoucher, markVoucherRedeemed } from '../actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
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

export default async function AdminVouchersPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    restaurant?: string;
    email?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}) {
  const supabase = createClient();

  const status = (searchParams?.status ?? '').trim();
  const restaurantId = (searchParams?.restaurant ?? '').trim();
  const email = (searchParams?.email ?? '').trim().toLowerCase();
  const from = (searchParams?.from ?? '').trim();
  const to = (searchParams?.to ?? '').trim();
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('vouchers')
    .select(
      'id, code, email, ip_address, status, menu_item_name, issued_at, expires_at, redeemed_at, restaurant_id, restaurants(name)',
      { count: 'exact' },
    )
    .order('issued_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status && ['issued', 'redeemed', 'expired', 'voided'].includes(status)) {
    query = query.eq('status', status);
  }
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  if (email) query = query.ilike('email', `%${email}%`);
  if (from) query = query.gte('issued_at', from);
  if (to) query = query.lte('issued_at', to);

  const { data: vouchers, count, error } = await query;

  // Restaurant filter list (active + inactive — all of them).
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .order('name', { ascending: true });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (restaurantId) params.set('restaurant', restaurantId);
    if (email) params.set('email', email);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/admin/vouchers?${qs}` : '/admin/vouchers';
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">Vouchers</h1>
        <p className="text-sm text-ink-500">
          {total.toLocaleString()} match{total === 1 ? '' : 'es'} · page {page} of {totalPages}
        </p>
      </header>

      <form className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Status</label>
          <select name="status" defaultValue={status} className="input py-2 text-sm">
            <option value="">All</option>
            <option value="issued">Issued</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
            <option value="voided">Voided</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-2">
          <label className="label">Restaurant</label>
          <select name="restaurant" defaultValue={restaurantId} className="input py-2 text-sm">
            <option value="">All</option>
            {(restaurants ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Email contains</label>
          <input
            type="text"
            name="email"
            defaultValue={email}
            className="input py-2 text-sm"
          />
        </div>
        <div>
          <label className="label">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="input py-2 text-sm"
          />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" name="to" defaultValue={to} className="input py-2 text-sm" />
        </div>
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex justify-end gap-2">
          <Link href="/admin/vouchers" className="btn-outline text-sm py-2">
            Reset
          </Link>
          <button type="submit" className="btn-primary text-sm py-2">
            Apply filters
          </button>
        </div>
      </form>

      {error && (
        <div className="card p-4 text-sm text-red-700">Failed to load: {error.message}</div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1.4fr_1.4fr_1.2fr_0.8fr_2.4fr_1.4fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
          <span>Code</span>
          <span>Email</span>
          <span>Restaurant</span>
          <span>Item</span>
          <span>Status</span>
          <span>Issued / Expires / Redeemed</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-ink-100">
          {(vouchers ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">No vouchers match these filters.</div>
          )}
          {(vouchers ?? []).map((v) => {
            const raw = (v as unknown as { restaurants: { name?: string | null } | { name?: string | null }[] | null }).restaurants;
            const restaurant = Array.isArray(raw) ? raw[0] : raw;
            const restaurantName = restaurant?.name ?? '—';
            return (
              <div
                key={v.id}
                className="md:grid md:grid-cols-[1fr_1.4fr_1.4fr_1.2fr_0.8fr_2.4fr_1.4fr] md:gap-2 md:items-center p-4 md:px-4 md:py-3 text-sm flex flex-col gap-2"
              >
                <span className="font-mono text-xs text-ink-700">{v.code}</span>
                <span className="text-ink-700 truncate">{v.email}</span>
                <span className="text-ink-700 truncate">
                  <Link
                    href={`/admin/restaurants/${v.restaurant_id}`}
                    className="hover:text-brand-700"
                  >
                    {restaurantName}
                  </Link>
                </span>
                <span className="text-ink-700 truncate">{v.menu_item_name}</span>
                <span><StatusBadge status={v.status} /></span>
                <span className="text-xs text-ink-500 leading-snug">
                  <span className="block">Issued: {formatDate(v.issued_at)}</span>
                  <span className="block">Expires: {formatDate(v.expires_at)}</span>
                  {v.redeemed_at && (
                    <span className="block">Redeemed: {formatDate(v.redeemed_at)}</span>
                  )}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {v.status === 'issued' && (
                    <form
                      action={async () => {
                        'use server';
                        await markVoucherRedeemed(v.id);
                      }}
                    >
                      <button className="btn-primary text-xs px-2.5 py-1">Mark redeemed</button>
                    </form>
                  )}
                  {(v.status === 'issued' || v.status === 'expired') && (
                    <form
                      action={async () => {
                        'use server';
                        await voidVoucher(v.id);
                      }}
                    >
                      <button className="text-xs px-2.5 py-1 rounded-full border border-red-200 bg-white text-red-700 hover:bg-red-50">
                        Void
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={buildPageUrl(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`btn-outline text-sm py-2 ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            &larr; Previous
          </Link>
          <span className="text-ink-500">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildPageUrl(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`btn-outline text-sm py-2 ${
              page >= totalPages ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            Next &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
