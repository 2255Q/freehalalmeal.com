import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MealsCounter } from '@/components/MealsCounter';
import { createClient } from '@/lib/supabase/server';
import type { Restaurant } from '@/lib/types';

// Server component — gracefully fall back if Supabase isn't configured yet.
async function getMealsServed(): Promise<number> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('meals_served_total');
    if (error || data == null) throw error ?? new Error('no data');
    return Number(data) || 5200;
  } catch {
    return 5200;
  }
}

async function getFeaturedRestaurants(): Promise<Restaurant[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('status', 'active')
      .limit(6);
    if (error) throw error;
    return (data as Restaurant[]) ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [mealsServed, featured] = await Promise.all([
    getMealsServed(),
    getFeaturedRestaurants(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ─────────────── HERO ─────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          {/* Decorative Islamic 8-point geometric star, low opacity */}
          <svg
            aria-hidden
            className="absolute -right-24 -top-24 h-[640px] w-[640px] text-white/[0.06]"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <g>
              {/* Outer 8-point star (two overlaid squares) */}
              <rect x="80" y="80" width="240" height="240" />
              <rect
                x="80"
                y="80"
                width="240"
                height="240"
                transform="rotate(45 200 200)"
              />
              {/* Inner concentric stars */}
              <rect x="120" y="120" width="160" height="160" />
              <rect
                x="120"
                y="120"
                width="160"
                height="160"
                transform="rotate(45 200 200)"
              />
              <rect x="160" y="160" width="80" height="80" />
              <rect
                x="160"
                y="160"
                width="80"
                height="80"
                transform="rotate(45 200 200)"
              />
              <circle cx="200" cy="200" r="180" />
              <circle cx="200" cy="200" r="120" />
              <circle cx="200" cy="200" r="60" />
            </g>
          </svg>

          <div className="container-page relative pt-10 pb-24 sm:pt-14 sm:pb-32">
            {/* Top-right meals-served badge */}
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
                {mealsServed.toLocaleString()}+ meals served
              </span>
            </div>

            <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-8 lg:items-center">
              <div className="lg:col-span-7 animate-fade-up">
                <p className="text-brand-200 text-sm font-medium tracking-wide uppercase">
                  <span aria-hidden className="mr-2 text-base">﷽</span>
                  In the name of God, the Most Gracious
                </p>
                <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
                  Free halal meals
                  <br />
                  <span className="text-brand-200">for humanity.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-50/90">
                  We connect halal restaurants with neighbors who need a meal —
                  no questions, no paperwork, just hospitality. Claim a voucher
                  with your email and a participating restaurant will welcome
                  you in.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/restaurants" className="btn-accent text-base px-6 py-3">
                    Browse restaurants
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <Link href="/partner/signup" className="btn-ghost text-base px-6 py-3 text-white">
                    Restaurant partner
                  </Link>
                </div>

                <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">100% Halal</dt>
                    <dd className="mt-1 text-sm text-white/80">Verified partners</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">No paperwork</dt>
                    <dd className="mt-1 text-sm text-white/80">Just an email</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">Local first</dt>
                    <dd className="mt-1 text-sm text-white/80">Community-led</dd>
                  </div>
                </dl>
              </div>

              {/* Right-side editorial card with image */}
              <div className="lg:col-span-5 animate-fade-up [animation-delay:120ms]">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-4xl bg-gradient-to-br from-accent-500/20 to-brand-300/20 blur-2xl" aria-hidden />
                  <div className="relative rounded-4xl overflow-hidden shadow-lift ring-1 ring-white/20">
                    {/* Real Unsplash photo of warm Mediterranean food */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&q=80&auto=format&fit=crop"
                      alt="A welcoming table of halal Mediterranean food"
                      className="h-[420px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
                    <figcaption className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-xs uppercase tracking-wide text-brand-200">A shared table</p>
                      <p className="mt-1 font-display text-xl leading-snug">
                        &ldquo;Feeding people is among the best of deeds.&rdquo;
                      </p>
                    </figcaption>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── MISSION CARD ─────────────── */}
        <section className="container-page -mt-16 relative z-10">
          <div className="mx-auto max-w-4xl rounded-4xl bg-cream-100 border border-cream-200 px-8 py-12 sm:px-14 sm:py-16 shadow-soft text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Our mission</p>
            <h2 className="mt-4 text-3xl sm:text-4xl text-ink-900 leading-tight">
              Free Halal Meals for Humanity.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-700">
              We believe everyone deserves access to nutritious, halal food —
              regardless of circumstance. By weaving together generous restaurants,
              everyday donors, and neighbors in need, we&rsquo;re building a quiet
              but unstoppable movement of dignity at the dinner table.
            </p>

            <figure className="mt-10 border-t border-cream-200 pt-8">
              <blockquote className="font-display text-xl sm:text-2xl text-ink-800 leading-snug italic">
                &ldquo;Messenger of Allah, which aspect of Islam is best?&rdquo; He replied,
                &ldquo;Feeding people and greeting those you know and those you do not know.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm text-ink-500">
                — Abdullah ibn &lsquo;Amr · <span className="italic">Sahih, Al-Adab Al-Mufrad: 1013</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ─────────────── HOW IT WORKS ─────────────── */}
        <section className="container-page py-24 sm:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">How it works</p>
            <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Three simple steps to a warm meal</h2>
            <p className="mt-4 text-ink-600 leading-relaxed">
              Designed to be effortless. We removed the forms, the eligibility checks,
              and the awkwardness — so the only thing between you and a meal is a click.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Browse restaurants near you',
                body: 'See participating halal restaurants in your area, their menus, and the meals available today.',
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                  </svg>
                ),
                tone: 'brand',
              },
              {
                n: '02',
                title: 'Claim your free voucher',
                body: 'Enter your email — we send a single-use voucher with a QR code, ready to show on your phone.',
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a.75.75 0 0 0 .75.75H21V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.5h3.75a.75.75 0 0 0 .75-.75V6m9 0a3 3 0 0 0-6 0m6 0H7.5" />
                  </svg>
                ),
                tone: 'accent',
              },
              {
                n: '03',
                title: 'Show it — no questions asked',
                body: 'Walk in, show the voucher, enjoy your meal. Restaurants honor every voucher with a warm welcome.',
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                ),
                tone: 'brand',
              },
            ].map((step) => (
              <li
                key={step.n}
                className="card p-7 hover:shadow-lift transition-shadow group"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                    step.tone === 'accent'
                      ? 'bg-accent-100 text-accent-600'
                      : 'bg-brand-50 text-brand-700'
                  } group-hover:scale-105 transition-transform`}
                >
                  {step.icon}
                </div>
                <p className="mt-6 text-xs font-mono tracking-widest text-ink-400">{step.n}</p>
                <h3 className="mt-1 text-xl text-ink-900">{step.title}</h3>
                <p className="mt-3 text-ink-600 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─────────────── FEATURED RESTAURANTS ─────────────── */}
        <section className="bg-white border-y border-ink-100 py-24">
          <div className="container-page">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Featured partners</p>
                <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">
                  Restaurants serving with heart
                </h2>
              </div>
              <Link href="/restaurants" className="text-sm font-medium text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
                See all restaurants
                <span aria-hidden>→</span>
              </Link>
            </div>

            {featured.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <Link
                    key={r.id}
                    href={`/restaurants/${r.slug}`}
                    className="card group hover:shadow-lift transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      {r.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.cover_url}
                          alt={r.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand-200 via-brand-300 to-accent-200" />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl text-ink-900">{r.name}</h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {r.cuisine ?? 'Halal'} · Local kitchen
                      </p>
                      <p className="mt-4 text-sm font-medium text-brand-700 group-hover:text-brand-800">
                        View menu →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="card p-6 flex flex-col items-start text-left"
                  >
                    <div className="h-44 -m-6 mb-6 w-[calc(100%+3rem)] bg-gradient-to-br from-cream-100 via-brand-50 to-brand-100" />
                    <span className="badge">Coming soon</span>
                    <h3 className="mt-4 text-xl text-ink-900">A neighborhood kitchen</h3>
                    <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                      Partner restaurants are joining now. Apply today and become one
                      of our founding kitchens — featured here for our entire community.
                    </p>
                    <Link
                      href="/partner/signup"
                      className="mt-5 text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Apply now →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─────────────── LIVE IMPACT COUNTER ─────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <div className="container-page py-24 sm:py-28 text-center relative">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-200 font-semibold">Live impact</p>
            <p className="mt-6 font-display text-7xl sm:text-8xl lg:text-9xl font-semibold tabular-nums tracking-tight">
              <MealsCounter target={mealsServed} />
            </p>
            <p className="mt-4 text-lg sm:text-xl text-brand-100">Meals served and counting</p>
            <p className="mt-6 max-w-xl mx-auto text-brand-50/80 leading-relaxed">
              Every number is a real person at a real table. Behind each meal is a
              restaurant who said &ldquo;come in,&rdquo; and a neighbor who walked
              away nourished and seen.
            </p>
          </div>
        </section>

        {/* ─────────────── SUPPORT YOUR COMMUNITY ─────────────── */}
        <section className="container-page py-24">
          <div className="mx-auto max-w-5xl rounded-4xl bg-brand-50 border border-brand-100 p-10 sm:p-14 grid gap-10 md:grid-cols-[auto,1fr] md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-soft">
              <svg className="h-10 w-10 text-accent-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 21s-7.5-4.78-7.5-12a4.5 4.5 0 0 1 8.25-2.49A4.5 4.5 0 0 1 19.5 9c0 7.22-7.5 12-7.5 12Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl text-ink-900">Support your community</h2>
              <p className="mt-4 text-ink-700 leading-relaxed">
                We&rsquo;re committed to <strong>100% halal</strong>, sourced and prepared
                by trusted local restaurants. Every meal stays in the community it came
                from. We operate as a non-profit dedicated to dignity at the table — no
                upselling, no judgement, no strings.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/about" className="btn-outline">Learn about us</Link>
                <Link href="/donate" className="btn-primary">Sponsor a meal</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── DONATE / SPONSOR CTA ─────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <div className="container-page py-24 sm:py-28 text-center relative">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-tight">
              Sponsor a meal,
              <br className="hidden sm:block" /> change a life.
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-brand-50/90">
              Your sponsorship goes directly to participating restaurants — funding
              wholesome meals for neighbors who&rsquo;d otherwise go without. Small
              gifts add up to entire shared tables.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/donate" className="btn-accent text-base px-7 py-3">
                Sponsor meals →
              </Link>
              <Link href="/partner/signup" className="text-sm font-medium text-brand-100 hover:text-white">
                Are you a restaurant? Join us →
              </Link>
            </div>
          </div>
        </section>

        {/* ─────────────── FINAL CTA BAND ─────────────── */}
        <section className="bg-gradient-to-r from-accent-500 via-accent-600 to-brand-700 text-white">
          <div className="container-page py-20 sm:py-24 grid gap-8 md:grid-cols-[1fr,auto] md:items-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-tight">
              Get your free <span className="italic">halal</span> meal.
            </h2>
            <Link
              href="/restaurants"
              className="btn-accent bg-white !text-accent-700 hover:bg-cream-100 hover:!text-accent-800 text-base px-7 py-3 self-start md:self-auto"
            >
              View restaurants →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
