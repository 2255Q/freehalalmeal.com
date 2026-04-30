import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About — our mission to feed every neighbor',
  description:
    'FreeHalalMeal.com connects halal restaurants with neighbors in need. Learn about the values, faith, and community spirit behind the project.',
};

const values = [
  {
    title: 'Dignity',
    body: 'No forms. No proof of need. No judgement. Every guest is welcomed as an honored visitor — because that is how a meal should be received.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
  },
  {
    title: 'Community',
    body: 'Every meal stays local. The restaurant feeding your neighbor is the same one your kids will love next year. We grow community at the table.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72M18 18.72v-.516a4.5 4.5 0 0 0-2.25-3.897M18 18.72v.013m-3.75-3.388a4.5 4.5 0 1 0-7.5 0M3 18.72a9.094 9.094 0 0 1-.741-.479 3 3 0 0 1 4.682-2.72M3 18.72v-.516a4.5 4.5 0 0 1 2.25-3.897" />
      </svg>
    ),
  },
  {
    title: 'Halal',
    body: 'Every partner we work with is verified halal. Our standards are non-negotiable so observant guests can eat without a second thought.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3 6-6m3.75 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: 'Generosity',
    body: 'Inspired by the Prophetic tradition of feeding people. Generosity multiplies — a single meal sets off a chain of small kindnesses we may never see.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white">
          <div className="absolute inset-0 bg-pattern pointer-events-none" />
          <svg
            aria-hidden
            className="absolute -left-32 -bottom-32 h-[520px] w-[520px] text-white/[0.05]"
            viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.2"
          >
            <rect x="80" y="80" width="240" height="240" />
            <rect x="80" y="80" width="240" height="240" transform="rotate(45 200 200)" />
            <circle cx="200" cy="200" r="180" />
            <circle cx="200" cy="200" r="120" />
            <circle cx="200" cy="200" r="60" />
          </svg>
          <div className="container-page py-24 sm:py-28 relative max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200 font-semibold">
              <span aria-hidden className="mr-2 text-base">﷽</span>
              About FreeHalalMeal.com
            </p>
            <h1 className="mt-5 text-5xl sm:text-6xl leading-[1.05]">
              A quiet movement for dignity at the dinner table.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-50/90">
              We&rsquo;re a community-powered platform connecting halal restaurants with
              anyone who needs a meal — no questions, no paperwork, no judgement. Just
              the simple, ancient act of feeding a neighbor.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="container-page py-24 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Our story</p>
          <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Why this exists</h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-ink-700">
            <p>
              FreeHalalMeal.com began with a simple observation: in every neighborhood,
              there are halal restaurants ready to feed people, and there are neighbors —
              students, the recently unemployed, single parents stretching the budget,
              travelers — who would deeply appreciate a free, dignified meal. The piece
              missing was a bridge.
            </p>
            <p>
              The Prophet Muhammad ﷺ said the best of Islam is &ldquo;to feed people and
              greet those you know and those you do not know.&rdquo; That hadith is our
              compass. We&rsquo;re not a soup kitchen, and we&rsquo;re not a tech company.
              We&rsquo;re a network of restaurants and donors saying: come in. There&rsquo;s
              a seat for you.
            </p>
            <p>
              We chose halal not as exclusion but as a guarantee — every guest, observant
              or not, knows the food is wholesome, ethical, and honors the same values that
              animate the project. We chose &ldquo;no questions asked&rdquo; because dignity
              is not means-tested. If you need a meal, that is reason enough.
            </p>
          </div>
        </section>

        {/* Values grid */}
        <section className="bg-white border-y border-ink-100 py-24">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">What we stand for</p>
              <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Four values, one table</h2>
            </div>
            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
                <li key={v.title} className="card p-7">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    {v.icon}
                  </div>
                  <h3 className="mt-6 text-xl text-ink-900">{v.title}</h3>
                  <p className="mt-2 text-ink-600 leading-relaxed">{v.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Team / founders placeholder */}
        <section className="container-page py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">The team</p>
            <h2 className="mt-3 text-4xl sm:text-5xl text-ink-900">Built by volunteers, powered by you</h2>
            <p className="mt-5 text-ink-600 leading-relaxed">
              FreeHalalMeal.com is built and maintained by a small group of volunteers — engineers,
              designers, restaurateurs, and community organizers — donating their time so 100% of
              every sponsorship dollar can go to meals.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {['Founders', 'Engineering', 'Community'].map((role) => (
              <div key={role} className="card p-7 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-brand-200 to-accent-200" />
                <p className="mt-5 font-display text-lg text-ink-900">{role}</p>
                <p className="mt-1 text-sm text-ink-500">
                  Volunteer-led · names coming soon
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
          <div className="container-page py-20 text-center">
            <h2 className="text-4xl sm:text-5xl">Want to help, partner, or just say hello?</h2>
            <p className="mt-5 text-brand-50/90 max-w-xl mx-auto">
              We love hearing from restaurants, donors, and community members. Reach out —
              we read every message.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="mailto:hello@freehalalmeal.com" className="btn-accent text-base px-7 py-3">
                Email us
              </a>
              <Link href="/partner/signup" className="btn-ghost text-base px-7 py-3 text-white">
                Become a partner
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
