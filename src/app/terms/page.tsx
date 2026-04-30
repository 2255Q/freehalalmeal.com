import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of FreeHalalMeal.com — voucher rules, restaurant partner obligations, and platform disclaimers.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
          <div className="container-page py-16 sm:py-20 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200 font-semibold">Legal</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-brand-50/90">Last updated: April 30, 2026</p>
          </div>
        </section>

        <article className="container-page py-16 max-w-3xl">
          <div className="rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4 text-sm text-ink-700">
            <strong>Note:</strong> These Terms are a starting template and should be
            reviewed by a qualified attorney before being relied upon. Use of the
            service is at your own risk.
          </div>

          <div className="mt-10 space-y-8 text-ink-700 leading-relaxed">
            <section>
              <h2 className="text-2xl text-ink-900">1. Acceptance of terms</h2>
              <p className="mt-3">
                By using FreeHalalMeal.com (the &ldquo;Service&rdquo;), you agree to these
                Terms. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">2. The Service</h2>
              <p className="mt-3">
                The Service is a community platform that lets halal restaurants
                (&ldquo;Partners&rdquo;) offer free meals via single-use vouchers, and
                lets members of the public (&ldquo;Guests&rdquo;) request those vouchers.
                We are an intermediary; we do not prepare or serve food.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">3. Voucher use</h2>
              <ul className="mt-3 list-disc pl-6 space-y-2">
                <li>
                  Vouchers are <strong>single-use</strong>: once redeemed, they cannot
                  be used again.
                </li>
                <li>
                  Vouchers are <strong>non-transferable</strong>: they are issued to a
                  specific email and intended for that person.
                </li>
                <li>
                  Vouchers <strong>have no cash value</strong> and cannot be exchanged
                  for cash, refunds, or alternate goods.
                </li>
                <li>
                  Vouchers are valid only at the issuing restaurant, only for the menu
                  item indicated on the voucher, and only during that restaurant&rsquo;s
                  stated meal hours.
                </li>
                <li>
                  Vouchers expire — typically within 7 days of issuance — as shown on
                  the voucher itself. Expired vouchers cannot be honored.
                </li>
                <li>
                  Misrepresentation, fraud, or abuse (such as automated mass voucher
                  generation) may result in voucher voiding and a permanent ban.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">4. Restaurant partner terms</h2>
              <p className="mt-3">
                As a Partner you agree that:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-2">
                <li>
                  All meals served via the Service are <strong>100% halal</strong>,
                  prepared in accordance with recognized halal standards.
                </li>
                <li>
                  You will <strong>honor every valid, unexpired voucher</strong>
                  presented during your stated operating hours, treating the Guest with
                  the same dignity and welcome as any paying customer.
                </li>
                <li>
                  You set your daily meal limit and the menu items available; you may
                  pause issuance at any time via the Partner dashboard.
                </li>
                <li>
                  You are solely responsible for food safety, allergen disclosure, and
                  compliance with all local laws governing your business.
                </li>
                <li>
                  We may suspend or remove Partners who repeatedly fail to honor
                  vouchers, do not meet halal standards, or otherwise violate these
                  Terms.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">5. Account responsibilities</h2>
              <p className="mt-3">
                If you create an account (Guest or Partner), you are responsible for
                keeping your credentials secure and for all activity under your
                account. Notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">6. Disclaimers</h2>
              <p className="mt-3">
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
                warranties of any kind. We do not guarantee the availability of any
                particular meal, that any specific restaurant will honor a voucher,
                or that the Service will be uninterrupted or error-free. Food
                preparation, allergens, and customer service are the sole
                responsibility of the Partner.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">7. Limitation of liability</h2>
              <p className="mt-3">
                To the fullest extent permitted by law, FreeHalalMeal.com, its
                volunteers, and its operators are not liable for any indirect,
                incidental, consequential, special, or exemplary damages arising
                from your use of the Service, including but not limited to food-borne
                illness, allergic reactions, or disputes between Guests and Partners.
                Our aggregate liability in any matter shall not exceed USD $100.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">8. Indemnification</h2>
              <p className="mt-3">
                You agree to indemnify and hold harmless FreeHalalMeal.com from any
                claim arising from your misuse of the Service or breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">9. Changes to these Terms</h2>
              <p className="mt-3">
                We may update these Terms over time. Continued use of the Service
                after changes are posted constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">10. Governing law</h2>
              <p className="mt-3">
                These Terms are governed by the laws of the jurisdiction in which
                FreeHalalMeal.com is operated, without regard to conflict-of-laws
                principles. Disputes shall be resolved in courts of competent
                jurisdiction located there.
              </p>
            </section>

            <section>
              <h2 className="text-2xl text-ink-900">11. Contact</h2>
              <p className="mt-3">
                Questions about these Terms? Email{' '}
                <a className="text-brand-700 hover:text-brand-800" href="mailto:legal@freehalalmeal.com">
                  legal@freehalalmeal.com
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
