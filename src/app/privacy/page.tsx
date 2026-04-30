import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How FreeHalalMeal.com collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
          <div className="container-page py-16 sm:py-20 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200 font-semibold">Legal</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-brand-50/90">
              Last updated: April 30, 2026
            </p>
          </div>
        </section>

        <article className="container-page py-16 max-w-3xl">
          <div className="rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4 text-sm text-ink-700">
            <strong>Note:</strong> This policy is a starting template. It should be
            reviewed by qualified legal counsel before relying on it for compliance
            in your jurisdiction.
          </div>

          <div className="mt-10 space-y-8 text-ink-700 leading-relaxed">
            <section>
              <h2 className="text-2xl text-ink-900">Who we are</h2>
              <p className="mt-3">
                FreeHalalMeal.com (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a platform that connects halal
                restaurants with people who would like a free meal. This Privacy
                Policy describes what personal data we process and why.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">What we collect</h2>
              <ul className="mt-3 list-disc pl-6 space-y-2">
                <li>
                  <strong>Email address.</strong> Required to issue a meal voucher and
                  to email it to you.
                </li>
                <li>
                  <strong>IP address.</strong> Logged at the moment a voucher is
                  issued, solely to detect and prevent abuse (e.g. mass automated
                  voucher generation).
                </li>
                <li>
                  <strong>Voucher records.</strong> Code, restaurant, time issued, and
                  whether the voucher was redeemed.
                </li>
                <li>
                  <strong>Restaurant partner data.</strong> If you sign up as a partner,
                  we collect your business name, contact information, address, and
                  basic operating details.
                </li>
                <li>
                  <strong>Cookies.</strong> Strictly-necessary cookies for keeping you
                  logged in and protecting forms (CSRF). We do not use advertising
                  trackers.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">How we use your data</h2>
              <p className="mt-3">
                Your data is used only to operate the service: issuing and validating
                vouchers, communicating with you about your voucher or partnership,
                and protecting the platform from abuse. We do not sell, rent, or trade
                personal data — to anyone, ever.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Where your data is stored</h2>
              <p className="mt-3">
                We host data with reputable third-party processors (e.g. Supabase,
                Resend) who provide industry-standard security. Data may be transferred
                across borders — by using the service you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Your rights</h2>
              <p className="mt-3">
                Depending on your jurisdiction (including under the GDPR and CCPA),
                you may have the right to access, correct, or delete the personal data
                we hold about you, to restrict or object to certain processing, and to
                lodge a complaint with a supervisory authority. To exercise any of
                these rights, email{' '}
                <a className="text-brand-700 hover:text-brand-800" href="mailto:privacy@freehalalmeal.com">
                  privacy@freehalalmeal.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Retention</h2>
              <p className="mt-3">
                Voucher records are retained for the lifetime of your account and up
                to 24 months after your last interaction, then deleted or fully
                anonymized. Aggregate, non-identifying meal counts may be retained
                indefinitely for impact reporting.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Children</h2>
              <p className="mt-3">
                The service is not directed at children under 13 and we do not
                knowingly collect their data. If you believe we have, please contact
                us so we can delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Changes</h2>
              <p className="mt-3">
                We&rsquo;ll update this page when our practices change and update the
                &ldquo;Last updated&rdquo; date. Material changes will be highlighted
                clearly at the top.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">Contact</h2>
              <p className="mt-3">
                Questions? Email{' '}
                <a className="text-brand-700 hover:text-brand-800" href="mailto:privacy@freehalalmeal.com">
                  privacy@freehalalmeal.com
                </a>.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
