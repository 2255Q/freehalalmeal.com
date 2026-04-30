import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { setRestaurantStatus } from '../actions';
import type { RestaurantStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'bg-brand-50 text-brand-700',
    pending: 'bg-accent-100 text-accent-700',
    suspended: 'bg-red-50 text-red-700',
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

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string };
}) {
  const supabase = createClient();
  const q = (searchParams?.q ?? '').trim();
  const statusFilter = (searchParams?.status ?? '').trim();

  let query = supabase
    .from('restaurants')
    .select('id, name, slug, email, cuisine, status, owner_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (statusFilter && ['pending', 'active', 'suspended'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }
  if (q) {
    // Simple OR across name/slug/email.
    query = query.or(
      `name.ilike.%${q}%,slug.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data: restaurants, error } = await query;

  // Counts per restaurant (locations) — done via service client because the
  // count needs to include inactive locations and works regardless of RLS.
  const svc = createServiceClient();
  const ids = (restaurants ?? []).map((r) => r.id);
  let locationCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: locs } = await svc
      .from('locations')
      .select('restaurant_id')
      .in('restaurant_id', ids);
    locationCounts = ((locs ?? []) as Array<{ restaurant_id: string }>).reduce<
      Record<string, number>
    >((acc, l) => {
      acc[l.restaurant_id] = (acc[l.restaurant_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const tabs: Array<{ key: string; label: string }> = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Restaurants</h1>
          <p className="text-sm text-ink-500">
            {restaurants?.length ?? 0} shown{q && ` matching "${q}"`}
            {statusFilter && ` · ${statusFilter}`}
          </p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, slug, or email"
            className="input max-w-xs text-sm py-2"
          />
          <button className="btn-outline text-sm py-2">Search</button>
        </form>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const params = new URLSearchParams();
          if (t.key) params.set('status', t.key);
          if (q) params.set('q', q);
          const qs = params.toString();
          const isActive = statusFilter === t.key;
          return (
            <Link
              key={t.key || 'all'}
              href={qs ? `/admin/restaurants?${qs}` : '/admin/restaurants'}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                isActive
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-700">Failed to load: {error.message}</div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.6fr_1.4fr_1fr_0.8fr_0.6fr_0.8fr_1.4fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
          <span>Name</span>
          <span>Email</span>
          <span>Slug</span>
          <span>Cuisine</span>
          <span>Locs</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-ink-100">
          {(restaurants ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">No restaurants found.</div>
          )}
          {(restaurants ?? []).map((r) => (
            <div
              key={r.id}
              className="md:grid md:grid-cols-[1.6fr_1.4fr_1fr_0.8fr_0.6fr_0.8fr_1.4fr] md:gap-2 md:items-center p-4 md:px-4 md:py-3 text-sm flex flex-col gap-2"
            >
              <Link
                href={`/admin/restaurants/${r.id}`}
                className="font-medium text-ink-900 hover:text-brand-700 truncate"
              >
                {r.name}
              </Link>
              <span className="text-ink-700 truncate">{r.email}</span>
              <span className="font-mono text-xs text-ink-500 truncate">{r.slug}</span>
              <span className="text-ink-600 text-xs truncate">{r.cuisine ?? '—'}</span>
              <span className="text-ink-700">{locationCounts[r.id] ?? 0}</span>
              <span><StatusBadge status={r.status} /></span>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={`/admin/restaurants/${r.id}`}
                  className="btn-outline text-xs px-2.5 py-1"
                >
                  View
                </Link>
                {r.status !== 'active' && (
                  <form
                    action={async () => {
                      'use server';
                      await setRestaurantStatus(r.id, 'active' as RestaurantStatus);
                    }}
                  >
                    <button className="btn-primary text-xs px-2.5 py-1">Activate</button>
                  </form>
                )}
                {r.status !== 'suspended' && (
                  <form
                    action={async () => {
                      'use server';
                      await setRestaurantStatus(r.id, 'suspended' as RestaurantStatus);
                    }}
                  >
                    <button className="text-xs px-2.5 py-1 rounded-full border border-red-200 bg-white text-red-700 hover:bg-red-50">
                      Suspend
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
