import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <section className="container-page py-24 sm:py-32 text-center max-w-2xl">
          {/* Decorative arabesque mark */}
          <svg
            aria-hidden
            className="mx-auto h-24 w-24 text-brand-200"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="50" cy="50" r="44" />
            <rect x="22" y="22" width="56" height="56" />
            <rect
              x="22"
              y="22"
              width="56"
              height="56"
              transform="rotate(45 50 50)"
            />
            <circle cx="50" cy="50" r="14" />
          </svg>

          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">
            Error 404
          </p>
          <h1 className="mt-3 text-5xl sm:text-6xl text-ink-900 leading-tight">
            Page not found
          </h1>
          <p className="mt-5 text-lg text-ink-600 leading-relaxed">
            The page you&rsquo;re looking for has wandered off. It happens — even
            the best directions sometimes lose their way.
          </p>

          <figure className="mt-10 mx-auto max-w-md">
            <blockquote className="font-display italic text-ink-700 leading-snug">
              &ldquo;Whoever travels a path in search of knowledge, Allah will make
              easy for them a path to Paradise.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm text-ink-500">— Sahih Muslim 2699</figcaption>
          </figure>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/restaurants" className="btn-outline">
              Browse restaurants
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
