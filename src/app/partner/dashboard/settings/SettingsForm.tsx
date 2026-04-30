'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';
import { updateRestaurant } from '@/app/partner/actions';

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl text-ink-900">Settings</h1>
        <p className="mt-2 text-ink-600">Edit your public restaurant profile.</p>
      </header>

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
