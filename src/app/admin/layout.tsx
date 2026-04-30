import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

/**
 * Admin layout — auth-gates the entire /admin tree.
 *
 * We intentionally query the `admins` table directly (rather than calling the
 * `is_admin()` SQL helper) so we can render a clear "Not authorized" message
 * when a logged-in user isn't in the allow-list.
 *
 * Bootstrap fallback: ADMIN_EMAILS (comma-separated) lets the very first owner
 * (Al) get into /admin before any row exists in the `admins` table. Once a
 * row is seeded, the env-var fallback is no longer needed but stays harmless.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/partner/login?next=/admin');
  }

  const userEmail = (user.email ?? '').toLowerCase();

  // Direct table query so we can show a clear unauthorized message.
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle();

  // Bootstrap allow-list — useful before the admins table is seeded.
  const bootstrapList = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const inBootstrap = bootstrapList.includes(userEmail);

  if (!adminRow && !inBootstrap) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-cream-50 px-4 text-center">
        <div className="max-w-md card p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            403 — Forbidden
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Not authorized</h1>
          <p className="mt-3 text-ink-600">
            Your account ({user.email}) doesn&apos;t have admin access. If you believe
            this is a mistake, ask the site owner to add you.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="btn-outline">Go home</Link>
            <form action="/admin/signout" method="post">
              <button type="submit" className="btn-ghost text-ink-700 border-ink-200">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/restaurants', label: 'Restaurants' },
    { href: '/admin/vouchers', label: 'Vouchers' },
    { href: '/admin/blocked-emails', label: 'Blocked emails' },
    { href: '/admin/blocked-ips', label: 'Blocked IPs' },
    { href: '/admin/admins', label: 'Admins' },
  ];

  return (
    <div className="min-h-dvh bg-ink-50 text-ink-800">
      {/* Distinct red-tinted top bar so admin is visually unmistakable */}
      <div className="bg-red-700 text-white">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 font-semibold uppercase tracking-wider">
              Admin
            </span>
            <span className="hidden sm:inline opacity-90">FreeHalalMeal.com — owner console</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-90">{user.email}</span>
            <form action="/admin/signout" method="post">
              <button type="submit" className="underline-offset-2 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="card p-3 h-max sticky top-4">
            <div className="px-3 py-3 border-b border-ink-100 mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                FreeHalalMeal
              </p>
              <p className="font-display text-lg text-ink-900 -mt-0.5">Admin</p>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t border-ink-100" />
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900"
              >
                Back to site
              </Link>
              <form action="/admin/signout" method="post">
                <button
                  type="submit"
                  className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                >
                  Sign out
                </button>
              </form>
            </nav>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
