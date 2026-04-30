'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  // Only allow internal redirects.
  const rawNext = searchParams.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
  const initialError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = new URL(`${origin}/partner/callback`);
      if (next) callbackUrl.searchParams.set('next', next);
      const callback = callbackUrl.toString();

      const { error: signInErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callback,
          shouldCreateUser: false,
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
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">
                Restaurant log in
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl text-ink-900">Welcome back</h1>
              <p className="mt-4 text-ink-600 leading-relaxed">
                Enter the email tied to your account and we&rsquo;ll send you a magic link.
              </p>
            </div>

            <div className="mt-10 card p-7 sm:p-9">
              {sent ? (
                <div className="text-center py-4">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h2 className="mt-5 text-2xl text-ink-900">Magic link sent</h2>
                  <p className="mt-3 text-ink-600 leading-relaxed">
                    Check <span className="font-medium text-ink-900">{email}</span> and click the
                    link to log in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-6 btn-outline"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@yourrestaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </div>

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
                    First time?{' '}
                    <Link href="/partner/signup" className="text-brand-700 hover:text-brand-800 font-medium">
                      Sign up →
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function PartnerLoginPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
