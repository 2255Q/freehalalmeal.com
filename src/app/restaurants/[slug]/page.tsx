import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import type { Location, MenuItem, Restaurant } from '@/lib/types';
import type { RestaurantMapMarker } from '@/components/RestaurantMap';

const RestaurantMap = dynamic(() => import('@/components/RestaurantMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-3xl bg-gradient-to-br from-brand-50 to-cream-100" />
  ),
});

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t: string | null | undefined) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  const min = Number(m);
  if (Number.isNaN(hour)) return t;
  const period = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  if (min === 0) return `${h12}${period}`;
  return `${h12}:${String(min).padStart(2, '0')}${period}`;
}

function formatDays(days: number[]) {
  if (!days || days.length === 0) return 'Not currently scheduled';
  if (days.length === 7) return 'Every day';
  // Detect a continuous run (e.g. Mon–Fri)
  const sorted = [...days].sort((a, b) => a - b);
  const isContinuous = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isContinuous && sorted.length >= 3) {
    return `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_SHORT[d]).join(', ');
}

interface PageProps {
  params: { slug: string };
}

interface RestaurantWithRels extends Restaurant {
  locations: Location[];
  menu_items: MenuItem[];
}

async function loadRestaurant(slug: string): Promise<RestaurantWithRels | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, locations(*), menu_items(*)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) {
    console.error('[restaurant detail] load error:', error);
    return null;
  }
  return data as RestaurantWithRels | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const r = await loadRestaurant(params.slug);
  if (!r) return { title: 'Restaurant not found' };
  return {
    title: r.name,
    description: r.description ?? `Claim a free halal meal at ${r.name}.`,
    openGraph: {
      title: r.name,
      description: r.description ?? undefined,
      images: r.cover_url ? [{ url: r.cover_url }] : undefined,
    },
  };
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const restaurant = await loadRestaurant(params.slug);
  if (!restaurant) notFound();

  const locations = (restaurant.locations ?? []).filter((l) => l.is_active);
  const menuItems = (restaurant.menu_items ?? [])
    .filter((m) => m.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const markers: RestaurantMapMarker[] = locations
    .filter(
      (l): l is Location & { latitude: number; longitude: number } =>
        typeof l.latitude === 'number' && typeof l.longitude === 'number',
    )
    .map((l) => ({
      id: l.id,
      name: `${restaurant.name} — ${l.label}`,
      slug: restaurant.slug,
      lat: l.latitude,
      lng: l.longitude,
      city: l.city,
    }));

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800">
            {restaurant.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.cover_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-pattern" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-transparent" />
          </div>

          <div className="container-page relative -mt-28 sm:-mt-32 pb-2">
            <div className="card p-6 sm:p-8 md:p-10">
              <div className="flex items-start gap-5">
                {restaurant.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logo_url}
                    alt=""
                    className="h-16 w-16 sm:h-20 sm:w-20 flex-none rounded-2xl object-cover border border-ink-100 bg-white shadow-soft"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 flex-none items-center justify-center rounded-2xl bg-brand-100 border border-brand-200">
                    <span className="font-display text-2xl text-brand-700">
                      {restaurant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {restaurant.cuisine && (
                      <span className="badge">{restaurant.cuisine}</span>
                    )}
                    {locations[0] && (
                      <span className="text-sm text-ink-500">
                        {locations[0].city}
                        {locations[0].region ? `, ${locations[0].region}` : ''}
                        {locations[0].country ? ` · ${locations[0].country}` : ''}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl text-ink-900 leading-tight">
                    {restaurant.name}
                  </h1>
                  {restaurant.description && (
                    <p className="mt-3 text-ink-600 leading-relaxed max-w-2xl">
                      {restaurant.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-page mt-12 grid gap-12 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Choose your meal */}
            <section id="menu">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-3xl text-ink-900">Choose your meal</h2>
                <span className="text-sm text-ink-500">
                  {menuItems.length} {menuItems.length === 1 ? 'option' : 'options'}
                </span>
              </div>
              <p className="mt-2 text-ink-600">
                Pick the meal you&rsquo;d like. We&rsquo;ll email you a voucher to redeem
                in person.
              </p>

              {menuItems.length === 0 ? (
                <div className="card mt-6 p-8 text-center">
                  <p className="text-ink-600">
                    This restaurant hasn&rsquo;t added meal options yet. Please check back
                    soon.
                  </p>
                </div>
              ) : (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {menuItems.map((item) => (
                    <li key={item.id} className="card group flex flex-col">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-cream-100 to-brand-50">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg
                              className="h-14 w-14 text-brand-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M3 12h18M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4m-2 4h-2m-8 0H7m12 0v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-display text-xl text-ink-900 leading-tight">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="mt-2 flex-1 text-sm text-ink-600 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <Link
                          href={`/restaurants/${restaurant.slug}/claim?item=${item.id}`}
                          className="btn-accent mt-5 w-full"
                        >
                          Claim this meal
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Locations */}
            <section id="locations">
              <h2 className="font-display text-3xl text-ink-900">
                {locations.length > 1 ? 'Locations' : 'Location'}
              </h2>
              {markers.length > 0 && (
                <div className="mt-5 h-72 overflow-hidden rounded-3xl border border-ink-100 shadow-soft">
                  <RestaurantMap markers={markers} />
                </div>
              )}
              {locations.length === 0 ? (
                <div className="card mt-5 p-8 text-center">
                  <p className="text-ink-600">No active locations listed.</p>
                </div>
              ) : (
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {locations.map((loc) => (
                    <li key={loc.id} className="card p-5">
                      <h3 className="font-display text-lg text-ink-900">{loc.label}</h3>
                      <address className="mt-2 not-italic text-sm text-ink-600 leading-relaxed">
                        {loc.address_line1}
                        {loc.address_line2 ? (
                          <>
                            <br />
                            {loc.address_line2}
                          </>
                        ) : null}
                        <br />
                        {loc.city}
                        {loc.region ? `, ${loc.region}` : ''}{' '}
                        {loc.postal_code ?? ''}
                        <br />
                        {loc.country}
                      </address>
                      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-sm">
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-ink-500">
                            Hours
                          </dt>
                          <dd className="mt-1 text-ink-800 font-medium">
                            {formatTime(loc.available_from)}–{formatTime(loc.available_until)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-ink-500">
                            Days
                          </dt>
                          <dd className="mt-1 text-ink-800 font-medium">
                            {formatDays(loc.available_days)}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-xs uppercase tracking-wider text-ink-500">
                            Daily free meals
                          </dt>
                          <dd className="mt-1 text-ink-800 font-medium">
                            Up to {loc.daily_meal_limit} per day
                          </dd>
                        </div>
                        {loc.phone && (
                          <div className="col-span-2">
                            <dt className="text-xs uppercase tracking-wider text-ink-500">
                              Phone
                            </dt>
                            <dd className="mt-1">
                              <a
                                href={`tel:${loc.phone}`}
                                className="text-brand-700 hover:text-brand-800 font-medium"
                              >
                                {loc.phone}
                              </a>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* About */}
            {(restaurant.description || restaurant.website || restaurant.phone) && (
              <section id="about">
                <h2 className="font-display text-3xl text-ink-900">About</h2>
                {restaurant.description && (
                  <p className="mt-3 text-ink-600 leading-relaxed">
                    {restaurant.description}
                  </p>
                )}
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  {restaurant.website && (
                    <div className="card p-4">
                      <dt className="text-xs uppercase tracking-wider text-ink-500">
                        Website
                      </dt>
                      <dd className="mt-1">
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-brand-700 hover:text-brand-800 font-medium break-all"
                        >
                          {restaurant.website.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="card p-4">
                      <dt className="text-xs uppercase tracking-wider text-ink-500">
                        Phone
                      </dt>
                      <dd className="mt-1">
                        <a
                          href={`tel:${restaurant.phone}`}
                          className="text-brand-700 hover:text-brand-800 font-medium"
                        >
                          {restaurant.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 self-start space-y-5">
            <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
              <p className="text-sm uppercase tracking-wider text-brand-100">
                Free meal voucher
              </p>
              <h3 className="mt-2 font-display text-2xl leading-tight">
                Choose a meal to claim your voucher
              </h3>
              <p className="mt-2 text-sm text-brand-50/90 leading-relaxed">
                You&rsquo;ll receive a one-time-use voucher by email. Show it at the
                restaurant — no questions asked.
              </p>
              {menuItems[0] && (
                <Link
                  href={`/restaurants/${restaurant.slug}/claim?item=${menuItems[0].id}`}
                  className="btn-accent mt-5 w-full"
                >
                  Claim a meal now
                </Link>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg text-ink-900">Good to know</h3>
              <ul className="mt-3 space-y-3 text-sm text-ink-600">
                <li className="flex gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-none text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>One voucher per email per restaurant per day.</span>
                </li>
                <li className="flex gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-none text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Vouchers are valid for 48 hours after issue.</span>
                </li>
                <li className="flex gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-none text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>No payment, no questions, no hassle.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
