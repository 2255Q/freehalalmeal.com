import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';
import { DashboardNav } from './_components/DashboardNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/partner/login');
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, status')
    .eq('owner_id', user.id)
    .maybeSingle();

  // No restaurant yet — only allow the setup page.
  // We can't read pathname in a layout, but the setup page itself handles
  // the no-restaurant case; for everything else we redirect to setup.
  // The layout still wraps setup, so we don't redirect here unconditionally —
  // we render a minimal shell when there's no restaurant.
  const hasRestaurant = !!restaurant;

  return (
    <div className="min-h-dvh flex flex-col bg-cream-50">
      {/* Dashboard top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-ink-100">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Logo />
            {hasRestaurant && (
              <>
                <span className="hidden sm:inline-block h-5 w-px bg-ink-200" />
                <span className="hidden sm:inline-block text-sm font-medium text-ink-700 truncate max-w-[14rem]">
                  {restaurant!.name}
                </span>
                {restaurant!.status !== 'active' && (
                  <span className="hidden sm:inline-flex badge bg-accent-100 text-accent-700">
                    {restaurant!.status}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasRestaurant && restaurant!.status === 'active' && (
              <Link
                href={`/restaurants/${restaurant!.slug}`}
                target="_blank"
                rel="noopener"
                className="hidden sm:inline-flex text-sm font-medium text-ink-700 hover:text-brand-700 px-3 py-2"
              >
                View public page →
              </Link>
            )}
            <form action="/partner/signout" method="post">
              <button type="submit" className="text-sm font-medium text-ink-600 hover:text-ink-900 px-3 py-2">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 container-page w-full py-8">
        <div className="grid gap-8 lg:grid-cols-[14rem,1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DashboardNav hasRestaurant={hasRestaurant} />
          </aside>

          {/* Main content */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
