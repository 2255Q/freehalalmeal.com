'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const ITEMS = [
  {
    href: '/partner/dashboard',
    label: 'Overview',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/partner/dashboard/locations',
    label: 'Locations',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
      </svg>
    ),
  },
  {
    href: '/partner/dashboard/menu',
    label: 'Menu items',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    ),
  },
  {
    href: '/partner/dashboard/vouchers',
    label: 'Vouchers',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a.75.75 0 0 0 .75.75H21V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.5h3.75a.75.75 0 0 0 .75-.75V6m9 0a3 3 0 0 0-6 0m6 0H7.5" />
      </svg>
    ),
  },
  {
    href: '/partner/dashboard/scan',
    label: 'Scan voucher',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 13.5h2.25v2.25H13.5V13.5Zm6 0h.75v.75h-.75V13.5Zm-3 3h.75v.75h-.75V16.5Zm-3 3h.75v.75h-.75v-.75Zm6 0h.75v.75h-.75v-.75Zm0-3h.75v.75h-.75V16.5Z" />
      </svg>
    ),
  },
  {
    href: '/partner/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/partner/dashboard') return pathname === href;
  return pathname.startsWith(href);
}

export function DashboardNav({ hasRestaurant }: { hasRestaurant: boolean }) {
  const pathname = usePathname() ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);

  // If no restaurant, only setup is meaningful.
  const items = hasRestaurant ? ITEMS : [];

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        Menu
      </button>

      <nav
        className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}
        aria-label="Dashboard"
      >
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900'
                  }`}
                >
                  <span className={active ? 'text-brand-700' : 'text-ink-500'}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}

          {!hasRestaurant && (
            <li>
              <Link
                href="/partner/dashboard/setup"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-brand-50 text-brand-800"
              >
                Get started
              </Link>
            </li>
          )}
        </ul>

        <div className="mt-6 border-t border-ink-100 pt-4">
          <form action="/partner/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            >
              <svg className="h-5 w-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
