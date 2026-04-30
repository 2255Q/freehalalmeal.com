'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

export default function PartnerSignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !name.trim()) {
      setError('Please fill in both your email and your restaurant name.');
      return;
    }
    if (!consent) {
      setError('Please confirm the halal commitment to continue.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callback = `${origin}/partner/callback?name=${encodeURIComponent(name.trim())}`;

      const { error: signInErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callback,
          shouldCreateUser: true,
        },
      });

      if (signInErr) throw signInErr;
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream-50">
        <section className="container-page py-16 sm:py-20">
          <div className="mx-auto max-w-xl">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">
                Restaurant signup
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl text-ink-900">Join as a partner</h1>
              <p className="mt-4 text-ink-600 leading-relaxed">
                We use a magic-link login — no passwords. Enter your email and your
                restaurant name; we&rsquo;ll email you a one-click link to confirm.
              </p>
            </div>

            <div className="mt-10 card p-7 sm:p-9">
              {sent ? (
                <div className="text-center py-6">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h2 className="mt-5 text-2xl text-ink-900">Check your email</h2>
                  <p className="mt-3 text-ink-600 leading-relaxed">
                    We sent a magic link to <span className="font-medium text-ink-900">{email}</span>.
                    Click it to confirm your email and finish setting up{' '}
                    <span className="font-medium text-ink-900">{name}</span>.
                  </p>
                  <p className="mt-4 text-sm text-ink-500">
                    Don&rsquo;t see it? Check spam, or wait a minute and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                    }}
                    className="mt-8 btn-outline"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label className="label" htmlFor="email">Restaurant email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="owner@yourrestaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="name">Restaurant name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Halal Garden Kitchen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-ink-700 leading-relaxed">
                      I commit to serving 100% halal meals and honoring vouchers during my stated hours.
                    </span>
                  </label>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-primary w-full text-base py-3"
                  >
                    {busy ? 'Sending…' : 'Send magic link'}
                  </button>

                  <p className="text-center text-sm text-ink-500">
                    Already have an account?{' '}
                    <Link href="/partner/login" className="text-brand-700 hover:text-brand-800 font-medium">
                      Log in →
                    </Link>
                  </p>
                </form>
              )}
            </div>

            <p className="mt-8 text-center text-xs text-ink-500">
              By signing up you agree to our{' '}
              <Link href="/terms" className="underline hover:text-ink-700">Terms</Link> and{' '}
              <Link href="/privacy" className="underline hover:text-ink-700">Privacy Policy</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
