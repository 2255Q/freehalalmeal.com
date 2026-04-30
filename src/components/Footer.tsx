import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-24 bg-white border-t border-ink-100">
      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 max-w-md">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Our journey is collective. If you wish to sponsor meals or have feedback on how we
            can serve better, we&rsquo;d love to hear from you. Together, let&rsquo;s sow the
            seeds of kindness and reap a united, nourished community.
          </p>
          <p className="mt-4 text-sm text-ink-500">
            <span aria-hidden>﷽</span> &nbsp; Bismillah ar-Rahman ar-Raheem
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Quick links</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-600">
            <li><Link href="/" className="hover:text-brand-700">Home</Link></li>
            <li><Link href="/restaurants" className="hover:text-brand-700">Browse restaurants</Link></li>
            <li><Link href="/partner/signup" className="hover:text-brand-700">Partner with us</Link></li>
            <li><Link href="/donate" className="hover:text-brand-700">Sponsor a meal</Link></li>
            <li><Link href="/about" className="hover:text-brand-700">About</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-600">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <a href="mailto:hello@freehalalmeal.com" className="hover:text-brand-700">hello@freehalalmeal.com</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Serving communities worldwide
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="container-page py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} FreeHalalMeal.com. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-brand-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-700">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
