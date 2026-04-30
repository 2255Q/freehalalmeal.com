import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NotifyForm } from '@/components/NotifyForm';

export const metadata: Metadata = {
  title: 'Sponsor a meal',
  description:
    'Sponsor a free halal meal for a neighbor in need. Your donation goes directly to participating local halal restaurants.',
};

const faqs = [
  {
    q: 'How does sponsorship work?',
    a: 'You contribute a small amount — enough to cover one or several meals. We pool sponsorships and pay participating restaurants directly for vouchers redeemed by guests in their community.',
  },
  {
    q: 'Where does the money go?',
    a: '100% of your sponsorship goes to meals. Restaurants are paid the agreed cost per meal at-or-below market rate. Operations are run by volunteers and offset by a small number of named donors.',
  },
  {
    q: 'Is it tax deductible?',
    a: 'We are working toward 501(c)(3) status. Once granted, sponsorships will be tax-deductible in the United States. We will email everyone on the early list as soon as that lands.',
  },
  {
    q: 'Can restaurants sign up?',
    a: 'Yes — any halal restaurant can apply to be a partner. There is no fee. You set your daily meal limit, the menu items you want to offer, and the hours you can serve.',
  },
];

export default function DonatePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <svg
            aria-hidden
            className="absolute -right-20 -top-20 h-[480px] w-[480px] text-white/[0.06]"
            viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.2"
          >
            <rect x="80" y="80" width="240" height="240" />
            <rect x="80" y="80" width="240" height="240" transform="rotate(45 200 200)" />
            <circle cx="200" cy="200" r="180" />
            <circle cx="200" cy="200" r="120" />
          </svg>
          <div className="container-page py-24 sm:py-28 relative max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200 font-semibold">Sponsor a meal</p>
            <h1 className="mt-5 text-5xl sm:text-6xl leading-[1.05]">
              One meal. One neighbor. <span className="text-brand-200">Real impact.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-50/90">
              Sponsorships fund free halal meals served by participating restaurants
              in their own communities. A small gift today becomes a warm plate
              tomorrow — for a student, a parent, a stranger you may never meet.
            </p>
          </div>
        </section>

        {/* Explanation */}
        <section className="container-page py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">How sponsorship works</p>
              <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Your gift, on a real table</h2>
              <ol className="mt-8 space-y-6 text-ink-700 leading-relaxed">
                <li className="flex gap-4">
                  <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">1</span>
                  <p><strong className="text-ink-900">You sponsor.</strong> Choose an amount — every dollar is matched to a meal at a participating halal restaurant.</p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">2</span>
                  <p><strong className="text-ink-900">A neighbor claims.</strong> They request a free voucher with just an email — no proof, no paperwork, no shame.</p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">3</span>
                  <p><strong className="text-ink-900">The restaurant serves.</strong> Your sponsorship is paid out directly to the restaurant after the meal is redeemed.</p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">4</span>
                  <p><strong className="text-ink-900">You see the impact.</strong> We email you when your sponsored meal is redeemed. Quiet, dignified, real.</p>
                </li>
              </ol>
            </div>

            <div className="space-y-6">
              {/* Coming soon notice */}
              <div className="rounded-3xl border border-accent-200 bg-accent-50 p-7">
                <div className="flex items-start gap-4">
                  <div className="flex-none flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg text-ink-900">Coming soon</h3>
                    <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                      Stripe integration is in development. Drop your email and we&rsquo;ll
                      let you know the moment sponsorship goes live — you&rsquo;ll be among
                      our founding sponsors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email capture */}
              <div className="card p-7">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Be first to know</p>
                <h3 className="mt-3 text-2xl text-ink-900">Join the early list</h3>
                <p className="mt-2 text-sm text-ink-600">
                  We&rsquo;ll send a single email when sponsorships open. No spam, ever.
                </p>
                <div className="mt-5">
                  <NotifyForm />
                </div>
              </div>

              {/* Suggested amounts (visual only) */}
              <div className="card p-7">
                <h3 className="text-2xl text-ink-900">What a meal costs</h3>
                <p className="mt-2 text-sm text-ink-600">
                  Restaurants set their own meal cost. Typical ranges:
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: '1 meal', amt: '$8' },
                    { label: '5 meals', amt: '$40' },
                    { label: '20 meals', amt: '$160' },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className="rounded-2xl border border-ink-200 bg-cream-50 px-3 py-4"
                    >
                      <p className="font-display text-2xl text-brand-700">{tier.amt}</p>
                      <p className="mt-1 text-xs text-ink-500">{tier.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border-y border-ink-100 py-24">
          <div className="container-page max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Frequently asked</p>
            <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Good questions, plain answers</h2>
            <dl className="mt-10 divide-y divide-ink-100 border-y border-ink-100">
              {faqs.map((f) => (
                <div key={f.q} className="py-7">
                  <dt className="text-lg font-semibold text-ink-900">{f.q}</dt>
                  <dd className="mt-2 text-ink-700 leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-sm text-ink-600">
              Still have questions?{' '}
              <a href="mailto:hello@freehalalmeal.com" className="text-brand-700 hover:text-brand-800 font-medium">
                Email us
              </a>{' '}
              — a real person will reply.
            </p>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-gradient-to-br from-accent-500 via-accent-600 to-brand-700 text-white">
          <div className="container-page py-20 text-center">
            <h2 className="text-4xl sm:text-5xl">Hungry now? Don&rsquo;t wait for sponsorship.</h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Restaurants are already serving free halal meals today. Browse what&rsquo;s
              available near you.
            </p>
            <Link href="/restaurants" className="mt-7 btn-accent bg-white !text-accent-700 hover:bg-cream-100 hover:!text-accent-800 text-base px-7 py-3">
              View restaurants →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
