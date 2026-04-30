import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ClaimForm } from '@/components/ClaimForm';
import { createClient } from '@/lib/supabase/server';
import type { Location, MenuItem, Restaurant } from '@/lib/types';

interface PageProps {
  params: { slug: string };
  searchParams: { item?: string };
}

interface RestaurantWithRels extends Restaurant {
  locations: Location[];
  menu_items: MenuItem[];
}

export const metadata: Metadata = {
  title: 'Claim your meal',
  description: 'Claim your free halal meal voucher.',
  robots: { index: false },
};

export default async function ClaimPage({ params, searchParams }: PageProps) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, locations(*), menu_items(*)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) notFound();

  const restaurant = data as RestaurantWithRels;
  const locations = (restaurant.locations ?? []).filter((l) => l.is_active);
  const menuItems = (restaurant.menu_items ?? []).filter((m) => m.is_active);

  const itemId = searchParams.item;
  const menuItem = menuItems.find((m) => m.id === itemId) ?? menuItems[0];

  if (!menuItem) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="container-page py-20 max-w-xl">
            <h1 className="font-display text-3xl text-ink-900">
              No meals available right now
            </h1>
            <p className="mt-3 text-ink-600">
              {restaurant.name} hasn&rsquo;t added any meal options yet. Please check
              back soon.
            </p>
            <Link href={`/restaurants/${restaurant.slug}`} className="btn-outline mt-6">
              Back to restaurant
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container-page py-10 sm:py-14">
          <Link
            href={`/restaurants/${restaurant.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
          >
            <span aria-hidden>←</span> Back to {restaurant.name}
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
                Almost there
              </p>
              <h1 className="mt-2 font-display text-4xl text-ink-900 leading-tight">
                Claim your free meal voucher
              </h1>
              <p className="mt-4 text-ink-600 leading-relaxed">
                Enter your email below. We&rsquo;ll send you a one-time voucher with a
                code and QR. Show it at the restaurant — no questions asked.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                    1
                  </span>
                  <p className="text-ink-700 leading-relaxed">
                    Submit your email — we email you a voucher with code + PDF.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                    2
                  </span>
                  <p className="text-ink-700 leading-relaxed">
                    Visit the restaurant during open hours within 48 hours.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                    3
                  </span>
                  <p className="text-ink-700 leading-relaxed">
                    Show your voucher to staff. They redeem it. Enjoy your meal.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <ClaimForm
                restaurant={restaurant}
                menuItem={menuItem}
                locations={locations}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
