import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BrowseClient, type RestaurantWithLocations } from '@/components/BrowseClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Browse partner restaurants',
  description:
    'Find a participating halal restaurant near you and claim a free meal voucher. No questions asked, no barriers — just kindness.',
};

export const revalidate = 60;

export default async function RestaurantsPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*, locations(*)')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('[restaurants] failed to load:', error);
  }

  // Trim locations to active only — RLS already filters but keep client lean.
  const restaurants: RestaurantWithLocations[] = (data ?? []).map((r) => ({
    ...r,
    locations: (r.locations ?? []).filter((l: { is_active: boolean }) => l.is_active),
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="container-page pt-10 pb-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
              Browse partner restaurants
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl text-ink-900 leading-tight">
              Find a free halal meal near you.
            </h1>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              Pick a restaurant, choose your meal, and we&rsquo;ll email you a voucher.
              No questions asked. No barriers — just kindness.
            </p>
          </div>
        </section>

        <section className="container-page pb-24">
          <BrowseClient restaurants={restaurants} />
        </section>
      </main>
      <Footer />
    </>
  );
}
