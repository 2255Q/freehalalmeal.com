'use client';

import { FormEvent, useState } from 'react';

/**
 * Simple visual-only email capture for the donate page.
 * No backend yet — just confirms intent so the page feels alive.
 */
export function NotifyForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    // Placeholder for real signup. Keep parity with the spec.
    alert("We'll email you when sponsorship is live!");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-800">
        Thank you. We&rsquo;ll be in touch as soon as sponsorships open.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
      <label htmlFor="notify-email" className="sr-only">Email address</label>
      <input
        id="notify-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="input flex-1"
      />
      <button type="submit" className="btn-accent">
        Notify me
      </button>
    </form>
  );
}
