'use client';

import { useState, useTransition } from 'react';
import type { Location } from '@/lib/types';
import {
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationActive,
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
  locations: Location[];
  todayCounts: Record<string, number>;
};

export function LocationsManager({ locations, todayCounts }: Props) {
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl text-ink-900">Locations</h1>
          <p className="mt-2 text-ink-600">Each location has its own hours and daily meal cap.</p>
        </div>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-primary">
          + Add location
        </button>
      </header>

      {locations.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-700">You haven&rsquo;t added any locations yet.</p>
          <button onClick={() => setCreating(true)} className="mt-4 btn-primary">
            Add your first location
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              todayCount={todayCounts[loc.id] ?? 0}
              onEdit={() => { setEditing(loc); setCreating(false); }}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <LocationFormModal
          location={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function LocationCard({
  location,
  todayCount,
  onEdit,
}: {
  location: Location;
  todayCount: number;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const fillPct = location.daily_meal_limit > 0
    ? Math.min(100, (todayCount / location.daily_meal_limit) * 100)
    : 0;
  const days = location.available_days
    .map((d) => DAYS[d]?.label)
    .filter(Boolean)
    .join(', ');

  function onToggle() {
    const fd = new FormData();
    fd.set('id', location.id);
    fd.set('is_active', String(!location.is_active));
    startTransition(async () => {
      await toggleLocationActive(fd);
    });
  }

  function onDelete() {
    if (!confirm(`Delete location "${location.label}"? This can't be undone.`)) return;
    const fd = new FormData();
    fd.set('id', location.id);
    startTransition(async () => {
      await deleteLocation(fd);
    });
  }

  return (
    <div className={`card p-6 ${!location.is_active ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-xl text-ink-900">{location.label}</h2>
            {!location.is_active && <span className="badge bg-ink-100 text-ink-600">inactive</span>}
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {location.address_line1}
            {location.address_line2 ? `, ${location.address_line2}` : ''}, {location.city}
            {location.region ? `, ${location.region}` : ''}
            {location.postal_code ? ` ${location.postal_code}` : ''}, {location.country}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {location.available_from.slice(0, 5)} – {location.available_until.slice(0, 5)} · {days || 'No days set'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-wide text-ink-500">Today</p>
          <p className="font-display text-2xl tabular-nums text-ink-900">
            {todayCount}<span className="text-ink-400 text-lg"> / {location.daily_meal_limit}</span>
          </p>
          <div className="mt-1 w-32 h-1.5 rounded-full bg-ink-100 overflow-hidden ml-auto">
            <div
              className={`h-full transition-all ${fillPct >= 100 ? 'bg-accent-500' : 'bg-brand-500'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <button onClick={onEdit} disabled={pending} className="btn-outline">Edit</button>
        <button onClick={onToggle} disabled={pending} className="btn-outline">
          {location.is_active ? 'Pause' : 'Activate'}
        </button>
        <button onClick={onDelete} disabled={pending} className="btn-outline text-red-700 border-red-200 hover:bg-red-50">
          Delete
        </button>
      </div>
    </div>
  );
}

function LocationFormModal({
  location,
  onClose,
}: {
  location: Location | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<string>(location?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState<string>(location?.longitude?.toString() ?? '');
  const isEdit = !!location;

  async function handleGeocode(form: HTMLFormElement) {
    setGeocoding(true);
    setError(null);
    try {
      const fd = new FormData(form);
      const parts = [
        fd.get('address_line1'),
        fd.get('city'),
        fd.get('region'),
        fd.get('postal_code'),
        fd.get('country'),
      ].filter(Boolean).join(', ');
      if (!parts) {
        setError('Add at least an address line and city before geocoding.');
        return;
      }
      // Public Nominatim API. Production should set User-Agent via server proxy.
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setLatitude(String(data[0].lat));
        setLongitude(String(data[0].lon));
      } else {
        setError('Could not geocode that address.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed.');
    } finally {
      setGeocoding(false);
    }
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (isEdit) formData.set('id', location!.id);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateLocation(formData);
        } else {
          await createLocation(formData);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-lift max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink-900">
            {isEdit ? 'Edit location' : 'Add location'}
          </h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form action={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Location label</label>
            <input name="label" required defaultValue={location?.label ?? ''} className="input" placeholder="e.g. Main, Downtown" />
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input name="address_line1" required defaultValue={location?.address_line1 ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Address line 2 (optional)</label>
            <input name="address_line2" defaultValue={location?.address_line2 ?? ''} className="input" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label">City</label>
              <input name="city" required defaultValue={location?.city ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Region / State</label>
              <input name="region" defaultValue={location?.region ?? ''} className="input" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Postal code</label>
              <input name="postal_code" defaultValue={location?.postal_code ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Country (ISO-2)</label>
              <input name="country" required maxLength={2} defaultValue={location?.country ?? ''} placeholder="US" className="input uppercase" />
            </div>
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input name="phone" defaultValue={location?.phone ?? ''} className="input" />
          </div>

          <div className="grid sm:grid-cols-[1fr,auto] gap-3 items-end">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Latitude</label>
                <input
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
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
              {geocoding ? 'Locating…' : 'Geocode'}
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="label">Open from</label>
              <input type="time" name="available_from" defaultValue={location?.available_from?.slice(0, 5) ?? '11:00'} className="input" />
            </div>
            <div>
              <label className="label">Open until</label>
              <input type="time" name="available_until" defaultValue={location?.available_until?.slice(0, 5) ?? '20:00'} className="input" />
            </div>
            <div>
              <label className="label">Daily meal limit</label>
              <input type="number" min={0} name="daily_meal_limit" defaultValue={location?.daily_meal_limit ?? 10} className="input" />
            </div>
          </div>

          <div>
            <span className="label">Available days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const checked = location ? location.available_days.includes(d.value) : true;
                return (
                  <label key={d.value} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:border-brand-300">
                    <input type="checkbox" name={`day_${d.value}`} defaultChecked={checked} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                    <span className="text-sm font-medium text-ink-700">{d.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <input type="hidden" name="_has_is_active" value="1" />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={location?.is_active ?? true}
              value="on"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Active (vouchers can be issued)
          </label>

          <div className="pt-4 border-t border-ink-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
