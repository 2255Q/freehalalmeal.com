import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Partner with us — feed your community',
  description:
    'Halal restaurants partnering with FreeHalalMeal.com offer a small number of free meals each day to neighbors who need them. Sign up free, set your daily cap, and serve with dignity.',
};

const STEPS = [
  {
    n: '01',
    title: 'Sign up in 60 seconds',
    body:
      'Enter your email and your restaurant name. We send a magic link — click it and you\'re in. No passwords, no paperwork.',
  },
  {
    n: '02',
    title: 'List the meals you offer',
    body:
      'Pick the dishes you\'d like to provide free, set a daily cap, and tell us your hours. You stay in full control of how many meals you serve each day.',
  },
  {
    n: '03',
    title: 'Welcome the guest, redeem the voucher',
    body:
      'A neighbor walks in, shows their voucher code or QR. You scan, mark it redeemed, and serve them a warm meal. That\'s it.',
  },
];

const BENEFITS = [
  {
    title: 'Community goodwill',
    body:
      'Your kitchen becomes a household name in the neighborhood — a place known for kindness, not just good food.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    title: 'Free marketing',
    body:
      'Your restaurant is featured on our public directory, with your menu, story, and photos. New guests discover you every week.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    title: 'Real social impact',
    body:
      'Every voucher is a real person at your table. You see your impact week by week — meals served, neighbors fed, dignity restored.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: 'You set the cap',
    body:
      'Pick a daily limit that fits your kitchen — 5 meals, 50 meals, whatever feels right. You can change it any time.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
      </svg>
    ),
  },
];

const FAQ = [
  {
    q: 'Does it cost anything to join?',
    a: "Nothing. FreeHalalMeal.com is free for restaurants. You absorb the cost of the meals you offer — and many of those costs are offset by community sponsors who fund meals on your behalf.",
  },
  {
    q: 'How many meals do I have to serve?',
    a: "As many or as few as you decide. You set a daily cap per location. Once the cap is hit, no new vouchers can be claimed for that day.",
  },
  {
    q: 'Who shows up to claim a meal?',
    a: "Anyone in the community who needs one. We don’t ask people to prove anything — that’s the point. A guest is a guest. You’re welcome to greet them like any other paying customer.",
  },
  {
    q: 'How do I know vouchers are real?',
    a: "Each voucher has a unique code and a QR. Your dashboard has a quick scanner — punch in the code or scan the QR and we’ll instantly tell you if it’s valid for your restaurant today.",
  },
  {
    q: 'What if someone is abusing the system?',
    a: "Vouchers are one-per-email-per-restaurant-per-day, single-use, and expire quickly. If you suspect abuse, flag it from the voucher screen and our team will investigate.",
  },
  {
    q: 'Can I pause or stop?',
    a: "Anytime. Toggle a location to inactive and no new vouchers can be issued for it. You’re always in control.",
  },
];

export default function PartnerLandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <div className="container-page relative pt-16 pb-24 sm:pt-20 sm:pb-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 lg:items-center">
              <div className="lg:col-span-7 animate-fade-up">
                <p className="text-brand-200 text-sm font-medium tracking-wide uppercase">
                  For halal restaurants
                </p>
                <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
                  Partner with us —
                  <br />
                  <span className="text-brand-200">feed your community.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-50/90">
                  Join a quiet movement of halal restaurants offering a few free meals
                  each day to neighbors who need them. You set the cap. We bring the
                  guest. Together, we feed the community.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/partner/signup" className="btn-accent text-base px-6 py-3">
                    Get started — it&rsquo;s free
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <Link href="/partner/login" className="btn-ghost text-base px-6 py-3 text-white">
                    I already have an account
                  </Link>
                </div>

                <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">No fees</dt>
                    <dd className="mt-1 text-sm text-white/80">Free forever</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">No password</dt>
                    <dd className="mt-1 text-sm text-white/80">Magic-link login</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-brand-200">You decide</dt>
                    <dd className="mt-1 text-sm text-white/80">Daily cap, hours, menu</dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-5 animate-fade-up [animation-delay:120ms]">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-4xl bg-gradient-to-br from-accent-500/20 to-brand-300/20 blur-2xl" aria-hidden />
                  <div className="relative rounded-4xl overflow-hidden shadow-lift ring-1 ring-white/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=900&q=80&auto=format&fit=crop"
                      alt="A halal restaurant kitchen serving a warm dish"
                      className="h-[420px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
                    <figcaption className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-xs uppercase tracking-wide text-brand-200">Your kitchen, your call</p>
                      <p className="mt-1 font-display text-xl leading-snug">
                        &ldquo;The best of people are those who are most beneficial to people.&rdquo;
                      </p>
                    </figcaption>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container-page py-24 sm:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">How it works</p>
            <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">
              Three simple steps to start serving
            </h2>
            <p className="mt-4 text-ink-600 leading-relaxed">
              Every part of this is designed to fit into a busy restaurant. Set up in a
              few minutes, then run it the same way you run takeout.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="card p-7 hover:shadow-lift transition-shadow">
                <p className="text-xs font-mono tracking-widest text-ink-400">{step.n}</p>
                <h3 className="mt-2 text-xl text-ink-900">{step.title}</h3>
                <p className="mt-3 text-ink-600 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* BENEFITS */}
        <section className="bg-white border-y border-ink-100 py-24">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Why partner</p>
              <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">
                A small commitment with a long shadow
              </h2>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="card p-7 flex items-start gap-5">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="text-xl text-ink-900">{b.title}</h3>
                    <p className="mt-2 text-ink-600 leading-relaxed">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container-page py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Common questions</p>
            <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">FAQ</h2>
          </div>

          <div className="mt-12 mx-auto max-w-3xl divide-y divide-ink-100 rounded-3xl bg-white border border-ink-100 shadow-soft">
            {FAQ.map((item, i) => (
              <details key={i} className="group p-6 sm:p-7">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="font-display text-lg text-ink-900">{item.q}</span>
                  <span className="mt-1 text-brand-600 transition-transform group-open:rotate-45">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </span>
                </summary>
                <p className="mt-3 text-ink-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <div className="container-page py-24 sm:py-28 text-center relative">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-tight">
              Ready to feed your community?
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-brand-50/90">
              Sign up takes about a minute. We won&rsquo;t ask for a credit card. We
              won&rsquo;t spam your inbox. Just a magic link, then a warm welcome.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/partner/signup" className="btn-accent text-base px-7 py-3">
                Get started →
              </Link>
              <Link href="/partner/login" className="text-sm font-medium text-brand-100 hover:text-white">
                Already have an account? Log in →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
