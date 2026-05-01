'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Restaurant } from '@/lib/types';
import {
  updateRestaurant,
  createLocation,
  createMenuItem,
} from '@/app/partner/actions';

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

type Props = {
  restaurant: Restaurant;
  initialStep: 1 | 2 | 3;
  hasLocation: boolean;
  hasMenuItem: boolean;
};

export function SetupWizard({ restaurant, initialStep, hasLocation, hasMenuItem }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Step 2 geocode
  const [geocoding, setGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  async function handleGeocode(form: HTMLFormElement, opts?: { silent?: boolean }) {
    setGeocoding(true);
    if (!opts?.silent) setError(null);
    try {
      const fd = new FormData(form);
      const parts = [
        fd.get('address_line1'),
        fd.get('city'),
        fd.get('region'),
        fd.get('postal_code'),
        fd.get('country'),
      ]
        .filter(Boolean)
        .join(', ');
      if (!parts) {
        if (!opts?.silent) {
          setError('Add at least an address line and city before geocoding.');
        }
        return;
      }
      // Public Nominatim API. Note: production should set a custom User-Agent
      // via a server-side proxy per Nominatim usage policy.
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setLatitude(String(data[0].lat));
        setLongitude(String(data[0].lon));
      } else if (!opts?.silent) {
        setError('Could not geocode that address. You can leave lat/lng blank for now.');
      }
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Geocoding failed.');
      }
    } finally {
      setGeocoding(false);
    }
  }

  /**
   * Auto-trigger geocode when address fields lose focus, if lat/lng are still
   * empty AND we have at least an address line + city. Silent on failure so it
   * doesn't pop an error if the user is mid-typing — they can still hit the
   * Geocode button manually for an explicit attempt with a visible error.
   */
  function handleAddressBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (latitude || longitude) return;
    const form = e.currentTarget.form;
    if (!form) return;
    const fd = new FormData(form);
    const hasMinimum = !!(fd.get('address_line1') && fd.get('city'));
    if (!hasMinimum) return;
    handleGeocode(form, { silent: true });
  }

  function handleStep1(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateRestaurant(formData);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  function handleStep2(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createLocation(formData);
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  function handleStep3(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createMenuItem(formData);
        router.push('/partner/dashboard');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  function skipToDashboard() {
    router.push('/partner/dashboard');
    router.refresh();
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-700 font-semibold">Welcome aboard</p>
        <h1 className="mt-2 text-3xl sm:text-4xl text-ink-900">Set up your restaurant</h1>
        <p className="mt-2 text-ink-600">
          Three quick steps and you&rsquo;re live. You can always edit any of this later.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-ink-500">
            <span className={step >= 1 ? 'text-brand-700' : ''}>1. Profile</span>
            <span className={step >= 2 ? 'text-brand-700' : ''}>2. Location</span>
            <span className={step >= 3 ? 'text-brand-700' : ''}>3. First meal</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <form
          action={(fd) => handleStep1(fd)}
          className="card p-7 space-y-5"
        >
          <div>
            <label className="label" htmlFor="name">Restaurant name</label>
            <input id="name" name="name" defaultValue={restaurant.name} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Contact email</label>
            <input id="email" type="email" name="email" defaultValue={restaurant.email} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="description">Short description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What makes your kitchen special?"
              defaultValue={restaurant.description ?? ''}
              className="input"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="cuisine">Cuisine</label>
              <input
                id="cuisine"
                name="cuisine"
                defaultValue={restaurant.cuisine ?? ''}
                placeholder="e.g. Mediterranean"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                defaultValue={restaurant.phone ?? ''}
                placeholder="+1 555 123 4567"
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              defaultValue={restaurant.website ?? ''}
              placeholder="https://"
              className="input"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="logo_url">Logo URL (optional)</label>
              <input id="logo_url" name="logo_url" defaultValue={restaurant.logo_url ?? ''} placeholder="https://" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="cover_url">Cover image URL (optional)</label>
              <input id="cover_url" name="cover_url" defaultValue={restaurant.cover_url ?? ''} placeholder="https://" className="input" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button type="button" onClick={skipToDashboard} className="text-sm text-ink-500 hover:text-ink-700">
              Skip for now
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : 'Continue →'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          action={(fd) => handleStep2(fd)}
          className="card p-7 space-y-5"
        >
          <p className="text-sm text-ink-600">
            Add your first location. You can add more later.
          </p>

          <div>
            <label className="label" htmlFor="label">Location label</label>
            <input id="label" name="label" required placeholder="e.g. Main, Downtown" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="address_line1">Address line 1</label>
            <input id="address_line1" name="address_line1" required onBlur={handleAddressBlur} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="address_line2">Address line 2 (optional)</label>
            <input id="address_line2" name="address_line2" className="input" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" name="city" required onBlur={handleAddressBlur} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="region">Region / State</label>
              <input id="region" name="region" onBlur={handleAddressBlur} className="input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="postal_code">Postal code</label>
              <input id="postal_code" name="postal_code" onBlur={handleAddressBlur} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="country">Country (ISO-2)</label>
              <input id="country" name="country" required maxLength={2} placeholder="US" onBlur={handleAddressBlur} className="input uppercase" />
            </div>
          </div>

          <div className="grid sm:grid-cols-[1fr,auto] gap-3 items-end">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="40.7128"
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-74.0060"
                  className="input"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => handleGeocode(e.currentTarget.form!)}
              disabled={geocoding}
              className="btn-outline"
            >
              {geocoding ? 'Locating…' : 'Geocode address'}
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="label" htmlFor="available_from">Open from</label>
              <input id="available_from" name="available_from" type="time" defaultValue="11:00" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="available_until">Open until</label>
              <input id="available_until" name="available_until" type="time" defaultValue="20:00" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="daily_meal_limit">Daily meal limit</label>
              <input id="daily_meal_limit" name="daily_meal_limit" type="number" min={0} defaultValue={10} className="input" />
            </div>
          </div>

          <div>
            <span className="label">Available days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label key={d.value} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:border-brand-300">
                  <input type="checkbox" name={`day_${d.value}`} defaultChecked className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium text-ink-700">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-ink-500 hover:text-ink-700">
                ← Back
              </button>
              <button type="button" onClick={skipToDashboard} className="text-sm text-ink-500 hover:text-ink-700">
                Skip for now
              </button>
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : 'Continue →'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form
          action={(fd) => handleStep3(fd)}
          className="card p-7 space-y-5"
        >
          <p className="text-sm text-ink-600">
            What&rsquo;s the first meal you&rsquo;d like to offer free? You can add more anytime.
          </p>

          <div>
            <label className="label" htmlFor="name">Meal name</label>
            <input id="name" name="name" required placeholder="e.g. Chicken Biryani" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="description">Description (optional)</label>
            <textarea id="description" name="description" rows={3} className="input" placeholder="Briefly describe this dish" />
          </div>
          <div>
            <label className="label" htmlFor="image_url">Image URL (optional)</label>
            <input id="image_url" name="image_url" placeholder="https://" className="input" />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-ink-500 hover:text-ink-700">
                ← Back
              </button>
              <button type="button" onClick={skipToDashboard} className="text-sm text-ink-500 hover:text-ink-700">
                Skip for now
              </button>
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : 'Finish →'}
            </button>
          </div>

          {(hasLocation || hasMenuItem) && (
            <p className="pt-2 text-xs text-ink-500">
              You can finish and head to the dashboard anytime.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
