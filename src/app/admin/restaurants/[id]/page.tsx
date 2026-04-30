import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { setRestaurantStatus, deleteRestaurant } from '../../actions';
import type { RestaurantStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

export default async function AdminRestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const svc = createServiceClient();

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!restaurant) notFound();

  // Look up owner email via service client (auth.users is not exposed via anon)
  let ownerEmail: string | null = null;
  try {
    const { data: ownerData } = await svc.auth.admin.getUserById(restaurant.owner_id);
    ownerEmail = ownerData?.user?.email ?? null;
  } catch {
    ownerEmail = null;
  }

  const [
    { data: locations },
    { data: menuItems },
    { count: vouchersTotal },
    { count: vouchersIssued },
    { count: vouchersRedeemed },
    { count: vouchersExpired },
    { count: vouchersVoided },
    { data: recentVouchers },
  ] = await Promise.all([
    supabase
      .from('locations')
      .select('*')
      .eq('restaurant_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', params.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id),
    supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .eq('status', 'issued'),
    supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .eq('status', 'redeemed'),
    supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .eq('status', 'expired'),
    supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .eq('status', 'voided'),
    supabase
      .from('vouchers')
      .select('id, code, email, status, issued_at, expires_at, redeemed_at, menu_item_name')
      .eq('restaurant_id', params.id)
      .order('issued_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/restaurants" className="text-xs text-ink-500 hover:text-ink-800">
            &larr; All restaurants
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-ink-900">{restaurant.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
            <StatusBadge status={restaurant.status} />
            <span className="font-mono text-xs">/{restaurant.slug}</span>
            {restaurant.cuisine && <span>· {restaurant.cuisine}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {restaurant.status !== 'active' && (
            <form
              action={async () => {
                'use server';
                await setRestaurantStatus(params.id, 'active' as RestaurantStatus);
              }}
            >
              <button className="btn-primary text-sm">Activate</button>
            </form>
          )}
          {restaurant.status !== 'suspended' && (
            <form
              action={async () => {
                'use server';
                await setRestaurantStatus(params.id, 'suspended' as RestaurantStatus);
              }}
            >
              <button className="text-sm rounded-full border border-red-200 bg-white text-red-700 hover:bg-red-50 px-4 py-2 font-semibold">
                Suspend
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Profile */}
      <section className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Contact email</p>
          <p className="text-ink-800">{restaurant.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Owner email</p>
          <p className="text-ink-800">{ownerEmail ?? <span className="text-ink-400">—</span>}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Phone</p>
          <p className="text-ink-800">{restaurant.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Website</p>
          <p className="text-ink-800 truncate">{restaurant.website ?? '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-ink-400">Description</p>
          <p className="text-ink-800 whitespace-pre-wrap">{restaurant.description ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Created</p>
          <p className="text-ink-800">{formatDate(restaurant.created_at)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Updated</p>
          <p className="text-ink-800">{formatDate(restaurant.updated_at)}</p>
        </div>
      </section>

      {/* Voucher stats */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'All vouchers', value: vouchersTotal ?? 0 },
          { label: 'Issued', value: vouchersIssued ?? 0 },
          { label: 'Redeemed', value: vouchersRedeemed ?? 0 },
          { label: 'Expired', value: vouchersExpired ?? 0 },
          { label: 'Voided', value: vouchersVoided ?? 0 },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink-900">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Locations */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Locations ({locations?.length ?? 0})
        </h2>
        <div className="card divide-y divide-ink-100">
          {(locations ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">No locations yet.</div>
          )}
          {(locations ?? []).map((l) => (
            <div key={l.id} className="p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink-900">
                  {l.label}
                  {!l.is_active && <span className="ml-2 text-xs text-red-600">(inactive)</span>}
                </p>
                <span className="text-xs text-ink-500">
                  Daily limit: {l.daily_meal_limit}
                </span>
              </div>
              <p className="text-ink-600 text-sm mt-1">
                {[l.address_line1, l.address_line2, l.city, l.region, l.postal_code, l.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {l.available_from} – {l.available_until} · days [{(l.available_days ?? []).join(',')}]
                {l.phone && ` · ${l.phone}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu items */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Menu items ({menuItems?.length ?? 0})
        </h2>
        <div className="card divide-y divide-ink-100">
          {(menuItems ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">No menu items yet.</div>
          )}
          {(menuItems ?? []).map((m) => (
            <div key={m.id} className="p-4 text-sm">
              <p className="font-medium text-ink-900">
                {m.name}
                {!m.is_active && <span className="ml-2 text-xs text-red-600">(inactive)</span>}
              </p>
              {m.description && <p className="text-ink-600 mt-0.5">{m.description}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Recent vouchers */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Recent vouchers
        </h2>
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_0.8fr_1.2fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
            <span>Code</span>
            <span>Email</span>
            <span>Item</span>
            <span>Status</span>
            <span>Issued</span>
          </div>
          <div className="divide-y divide-ink-100">
            {(recentVouchers ?? []).length === 0 && (
              <div className="p-6 text-sm text-ink-500">No vouchers yet.</div>
            )}
            {(recentVouchers ?? []).map((v) => (
              <div
                key={v.id}
                className="md:grid md:grid-cols-[1fr_1.5fr_1fr_0.8fr_1.2fr] md:gap-2 p-3 md:px-4 md:py-2 text-sm flex flex-col gap-1"
              >
                <span className="font-mono text-xs text-ink-700">{v.code}</span>
                <span className="text-ink-700 truncate">{v.email}</span>
                <span className="text-ink-700 truncate">{v.menu_item_name}</span>
                <span><StatusBadge status={v.status} /></span>
                <span className="text-ink-500 text-xs">{formatDate(v.issued_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-3">
          Danger zone
        </h2>
        <div className="card p-5 border-red-200 bg-red-50/40">
          <p className="text-sm text-ink-700">
            Deleting this restaurant <strong>cascades</strong> — it will also delete all of its
            locations, menu items, and vouchers permanently. This cannot be undone.
            Consider <em>suspending</em> instead.
          </p>
          <form
            className="mt-4"
            action={async () => {
              'use server';
              await deleteRestaurant(params.id);
              redirect('/admin/restaurants');
            }}
          >
            <button className="text-sm rounded-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-semibold">
              Delete restaurant
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
