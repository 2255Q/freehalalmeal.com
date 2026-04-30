'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Location, MenuItem, Restaurant } from '@/lib/types';

interface ClaimFormProps {
  restaurant: Restaurant;
  menuItem: MenuItem;
  locations: Location[];
}

interface SuccessState {
  code: string;
  expires_at: string;
  voucher_url: string;
}

function formatTime(t: string | null | undefined) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  const min = Number(m);
  if (Number.isNaN(hour)) return t;
  const period = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  if (min === 0) return `${h12}${period}`;
  return `${h12}:${String(min).padStart(2, '0')}${period}`;
}

export function ClaimForm({ restaurant, menuItem, locations }: ClaimFormProps) {
  const [email, setEmail] = useState('');
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? '');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const primary =
    locations.find((l) => l.id === locationId) ?? locations[0] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError('Please confirm the consent statement to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vouchers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          menu_item_id: menuItem.id,
          location_id: locationId || undefined,
          email,
          _hp: honeypot,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(
          json?.error ??
            'Sorry, we could not issue your voucher right now. Please try again.',
        );
        setSubmitting(false);
        return;
      }
      setSuccess({
        code: json.code,
        expires_at: json.expires_at,
        voucher_url: json.voucher_url,
      });
    } catch (err) {
      console.error(err);
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <SuccessPanel data={success} restaurant={restaurant} menuItem={menuItem} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary card */}
      <div className="card p-5 bg-gradient-to-br from-cream-50 to-brand-50/30">
        <p className="text-xs uppercase tracking-wider text-brand-700 font-semibold">
          You&rsquo;re claiming
        </p>
        <p className="mt-1 font-display text-2xl text-ink-900 leading-tight">
          {menuItem.name}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          at <span className="font-semibold text-ink-800">{restaurant.name}</span>
        </p>
        {primary && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-600">
            <svg
              className="h-4 w-4 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Open today {formatTime(primary.available_from)}–
            {formatTime(primary.available_until)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="label">
          Your email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
        <p className="mt-1.5 text-xs text-ink-500">
          We&rsquo;ll email your voucher here. We don&rsquo;t share your email.
        </p>
      </div>

      {locations.length > 1 && (
        <div>
          <label htmlFor="location" className="label">
            Which location?
          </label>
          <select
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="input"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} — {l.city}
                {l.region ? `, ${l.region}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Honeypot — hidden from humans */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          required
        />
        <span className="leading-relaxed">
          I am claiming this voucher for myself or someone in need. I understand it can
          only be used once.
        </span>
      </label>

      {error && (
        <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-accent w-full text-base py-3"
      >
        {submitting ? 'Issuing your voucher…' : 'Get my voucher'}
      </button>

      <p className="text-center text-xs text-ink-500">
        By claiming, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-brand-700">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-brand-700">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

function SuccessPanel({
  data,
  restaurant,
  menuItem,
}: {
  data: SuccessState;
  restaurant: Restaurant;
  menuItem: MenuItem;
}) {
  const expiresDate = new Date(data.expires_at);
  return (
    <div className="card p-8 sm:p-10 text-center bg-gradient-to-br from-brand-50 to-cream-50 animate-fade-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-soft">
        <svg
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="mt-5 font-display text-3xl text-ink-900">Your voucher is ready.</h2>
      <p className="mt-2 text-ink-600">
        Bismillah — enjoy your <strong>{menuItem.name}</strong> at{' '}
        <strong>{restaurant.name}</strong>.
      </p>

      <div className="mt-6 mx-auto max-w-sm rounded-2xl border-2 border-dashed border-brand-300 bg-white px-5 py-5">
        <p className="text-xs uppercase tracking-wider text-brand-700 font-semibold">
          Voucher code
        </p>
        <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-ink-900 tracking-widest">
          {data.code}
        </p>
        <p className="mt-3 text-xs text-ink-500">
          Valid until {expiresDate.toLocaleString()}
        </p>
      </div>

      <p className="mt-6 text-sm text-ink-600">
        We&rsquo;ve emailed you a copy with a printable PDF. You can also view and print
        your voucher below.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={data.voucher_url} className="btn-primary">
          View &amp; print voucher
        </Link>
        <Link href={`/restaurants/${restaurant.slug}`} className="btn-outline">
          Back to restaurant
        </Link>
      </div>

      <p className="mt-8 text-xs text-ink-500 italic">
        Feeding people is among the noblest acts. May this meal bring you ease.
      </p>
    </div>
  );
}
