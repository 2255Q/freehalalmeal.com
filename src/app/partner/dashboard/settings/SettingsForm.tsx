'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';
import {
  updateRestaurant,
  pauseRestaurant,
  resumeRestaurant,
} from '@/app/partner/actions';

const STATUS_BADGE: Record<Restaurant['status'], string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-ink-100 text-ink-800 border-ink-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
};

function toLocalInputValue(iso: string | null): string {
  // datetime-local wants "YYYY-MM-DDTHH:mm" — slice the stored ISO string
  // to drop seconds and the timezone marker. Treats the timestamp at face
  // value (server-instant); explicit timezone UX is a future polish.
  if (!iso) return '';
  return iso.slice(0, 16);
}

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Separate state for the pause/resume panel so its toasts don't collide
  // with the profile form's.
  const [statusPending, startStatusTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaved, setStatusSaved] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateRestaurant(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  function onPause() {
    setStatusError(null);
    setStatusSaved(false);
    startStatusTransition(async () => {
      try {
        await pauseRestaurant();
        setStatusSaved(true);
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : 'Could not pause.');
      }
    });
  }

  function onResume() {
    setStatusError(null);
    setStatusSaved(false);
    startStatusTransition(async () => {
      try {
        await resumeRestaurant();
        setStatusSaved(true);
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : 'Could not resume.');
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl text-ink-900">Settings</h1>
        <p className="mt-2 text-ink-600">Edit your public restaurant profile.</p>
      </header>

      {/* Section A: One-click pause toggle (separate form) */}
      <div className="card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink-900">Restaurant status</h2>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[restaurant.status]}`}
          >
            {restaurant.status}
          </span>
        </div>

        {statusError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {statusError}
          </div>
        )}
        {statusSaved && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800">
            Saved.
          </div>
        )}

        {restaurant.status === 'active' && (
          <>
            <p className="text-sm text-ink-600">
              Stop accepting vouchers across all locations. You can resume any time.
            </p>
            <form action={onPause}>
              <button
                type="submit"
                disabled={statusPending}
                className="btn-primary"
              >
                {statusPending ? 'Pausing…' : 'Pause restaurant'}
              </button>
            </form>
          </>
        )}

        {restaurant.status === 'paused' && (
          <>
            <p className="text-sm text-ink-600">
              Vouchers are not currently being issued. Click to resume.
            </p>
            <form action={onResume}>
              <button
                type="submit"
                disabled={statusPending}
                className="btn-primary"
              >
                {statusPending ? 'Resuming…' : 'Resume restaurant'}
              </button>
            </form>
          </>
        )}

        {restaurant.status === 'pending' && (
          <p className="text-sm text-ink-600">
            Your restaurant is awaiting review. You will be able to pause and resume
            once approved.
          </p>
        )}

        {restaurant.status === 'suspended' && (
          <p className="text-sm text-ink-600">
            Your account is suspended. Please contact support to restore access —
            self-managed pause and resume are disabled.
          </p>
        )}
      </div>

      <form action={onSubmit} className="card p-6 sm:p-7 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800">
            Saved.
          </div>
        )}

        <div>
          <label className="label" htmlFor="name">Restaurant name</label>
          <input id="name" name="name" required defaultValue={restaurant.name} className="input" />
        </div>

        <div>
          <label className="label" htmlFor="email">Contact email</label>
          <input id="email" type="email" name="email" required defaultValue={restaurant.email} className="input" />
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} defaultValue={restaurant.description ?? ''} className="input" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="cuisine">Cuisine</label>
            <input id="cuisine" name="cuisine" defaultValue={restaurant.cuisine ?? ''} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={restaurant.phone ?? ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="website">Website</label>
          <input id="website" name="website" defaultValue={restaurant.website ?? ''} className="input" placeholder="https://" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="logo_url">Logo URL</label>
            <input id="logo_url" name="logo_url" defaultValue={restaurant.logo_url ?? ''} className="input" />
            {restaurant.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.logo_url} alt="logo" className="mt-2 h-16 w-16 rounded-xl object-cover border border-ink-100" />
            )}
          </div>
          <div>
            <label className="label" htmlFor="cover_url">Cover image URL</label>
            <input id="cover_url" name="cover_url" defaultValue={restaurant.cover_url ?? ''} className="input" />
            {restaurant.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.cover_url} alt="cover" className="mt-2 h-20 w-full rounded-xl object-cover border border-ink-100" />
            )}
          </div>
        </div>

        {/* Capacity & availability */}
        <div className="pt-5 border-t border-ink-100">
          <h3 className="font-display text-base text-ink-900">Capacity & availability</h3>
        </div>

        {/* Section B: Monthly meal cap */}
        <div>
          <label className="label" htmlFor="monthly_meal_limit">
            Monthly meal cap (across all locations)
          </label>
          <input
            id="monthly_meal_limit"
            name="monthly_meal_limit"
            type="number"
            min={1}
            step={1}
            defaultValue={restaurant.monthly_meal_limit ?? ''}
            className="input"
          />
          <p className="mt-1 text-sm text-ink-500">
            Leave blank for unlimited. Resets at the start of each calendar month (UTC).
          </p>
        </div>

        {/* Section C: Scheduled pause window */}
        <div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="paused_from">Pause start</label>
              <input
                id="paused_from"
                name="paused_from"
                type="datetime-local"
                defaultValue={toLocalInputValue(restaurant.paused_from)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="paused_until">Pause end</label>
              <input
                id="paused_until"
                name="paused_until"
                type="datetime-local"
                defaultValue={toLocalInputValue(restaurant.paused_until)}
                className="input"
              />
            </div>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Optional. While the current time falls in this window, no vouchers will be
            issued. Leave both blank for no schedule.
          </p>
        </div>

        <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="text-sm text-ink-500 hover:text-ink-800">
            View public page →
          </Link>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="card p-6 bg-ink-50">
        <h2 className="font-display text-lg text-ink-900">Account</h2>
        <p className="mt-1 text-sm text-ink-600">
          Public URL: <span className="font-mono">/restaurants/{restaurant.slug}</span>
        </p>
        <p className="mt-1 text-sm text-ink-600">
          Status: <span className="font-medium text-ink-800">{restaurant.status}</span>
        </p>
      </div>
    </div>
  );
}
