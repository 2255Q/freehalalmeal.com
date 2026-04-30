import Link from 'next/link';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-cream-50/80 border-b border-ink-100">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
          <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
          <Link href="/restaurants" className="hover:text-brand-700 transition-colors">Browse restaurants</Link>
          <Link href="/about" className="hover:text-brand-700 transition-colors">About</Link>
          <Link href="/donate" className="hover:text-brand-700 transition-colors">Sponsor a meal</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/partner/login" className="hidden sm:inline-flex text-sm font-medium text-ink-700 hover:text-brand-700 px-3 py-2">
            Restaurant log in
          </Link>
          <Link href="/partner/signup" className="btn-primary">
            Restaurant signup
          </Link>
        </div>
      </div>
    </header>
  );
}
