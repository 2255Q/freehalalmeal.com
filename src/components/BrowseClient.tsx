'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { Restaurant, Location } from '@/lib/types';
import { RestaurantCard } from './RestaurantCard';
import type { RestaurantMapMarker } from './RestaurantMap';

const RestaurantMap = dynamic(() => import('./RestaurantMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-3xl bg-gradient-to-br from-brand-50 to-cream-100" />
  ),
});

export interface RestaurantWithLocations extends Restaurant {
  locations: Location[];
}

interface BrowseClientProps {
  restaurants: RestaurantWithLocations[];
}

type Tab = 'list' | 'map';

function useDebounced<T>(value: T, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function BrowseClient({ restaurants }: BrowseClientProps) {
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);
  const [mobileTab, setMobileTab] = useState<Tab>('list');

  const debouncedSearch = useDebounced(search, 180);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine && set.add(r.cuisine));
    return Array.from(set).sort();
  }, [restaurants]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) =>
      r.locations.forEach((l) => l.country && set.add(l.country)),
    );
    return Array.from(set).sort();
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return restaurants.filter((r) => {
      if (cuisine && r.cuisine !== cuisine) return false;
      if (country && !r.locations.some((l) => l.country === country)) return false;
      if (!q) return true;
      const hay = [
        r.name,
        r.cuisine ?? '',
        r.description ?? '',
        ...r.locations.map((l) => `${l.city} ${l.region ?? ''} ${l.country}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [restaurants, debouncedSearch, cuisine, country]);

  const markers: RestaurantMapMarker[] = useMemo(() => {
    const out: RestaurantMapMarker[] = [];
    filtered.forEach((r) => {
      r.locations.forEach((l) => {
        if (typeof l.latitude === 'number' && typeof l.longitude === 'number') {
          out.push({
            id: r.id,
            name: r.name,
            slug: r.slug,
            lat: l.latitude,
            lng: l.longitude,
            city: l.city,
          });
        }
      });
    });
    return out;
  }, [filtered]);

  const empty = restaurants.length === 0;
  const noMatches = !empty && filtered.length === 0;

  return (
    <div>
      {/* Search + filter bar */}
      <div className="space-y-4">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Search by restaurant, city, or cuisine"
            className="input pl-12"
            aria-label="Search restaurants"
          />
        </div>

        {(cuisines.length > 0 || countries.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {cuisines.length > 0 && (
              <>
                <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
                  Cuisine
                </span>
                <button
                  type="button"
                  onClick={() => setCuisine(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    cuisine === null
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  All
                </button>
                {cuisines.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCuisine(c === cuisine ? null : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      cuisine === c
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </>
            )}
            {countries.length > 1 && (
              <>
                <span className="ml-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                  Country
                </span>
                <button
                  type="button"
                  onClick={() => setCountry(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    country === null
                      ? 'bg-accent-500 text-white'
                      : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  All
                </button>
                {countries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCountry(c === country ? null : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      country === c
                        ? 'bg-accent-500 text-white'
                        : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile tabs */}
      <div className="mt-6 flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            mobileTab === 'list'
              ? 'bg-brand-600 text-white shadow-soft'
              : 'bg-white border border-ink-200 text-ink-700'
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            mobileTab === 'map'
              ? 'bg-brand-600 text-white shadow-soft'
              : 'bg-white border border-ink-200 text-ink-700'
          }`}
        >
          Map
        </button>
      </div>

      {/* Empty state */}
      {empty ? (
        <EmptyState />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* List */}
          <div
            className={`lg:col-span-3 ${
              mobileTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {noMatches ? (
              <div className="card p-10 text-center">
                <p className="font-display text-xl text-ink-800">No matches found</p>
                <p className="mt-2 text-sm text-ink-600">
                  Try a different search or clear your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCuisine(null);
                    setCountry(null);
                  }}
                  className="btn-outline mt-4"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-ink-500">
                  Showing {filtered.length} of {restaurants.length}{' '}
                  {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((r) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      locations={r.locations}
                      highlighted={highlightedId === r.id}
                      onMouseEnter={() => setHighlightedId(r.id)}
                      onMouseLeave={() => setHighlightedId(undefined)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Map */}
          <div
            className={`lg:col-span-2 ${
              mobileTab === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="lg:sticky lg:top-20 h-[480px] lg:h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-ink-100 shadow-soft">
              <RestaurantMap
                markers={markers}
                highlightedId={highlightedId}
                onMarkerClick={(id) => setHighlightedId(id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const handleShare = async () => {
    const shareData = {
      title: 'FreeHalalMeal.com',
      text: "We're inviting halal restaurants to offer free meals to neighbors in need. Know one that might join us?",
      url: typeof window !== 'undefined' ? window.location.origin : '',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied — share it with a halal restaurant near you.');
      } catch {
        // fallthrough
      }
    }
  };

  return (
    <div className="mt-10 card p-10 sm:p-14 text-center bg-gradient-to-br from-cream-50 to-brand-50/40">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
        <svg
          className="h-8 w-8 text-brand-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>
      <h2 className="mt-5 font-display text-3xl text-ink-900">
        No partner restaurants in this area yet
      </h2>
      <p className="mx-auto mt-3 max-w-md text-ink-600 leading-relaxed">
        Help us grow this network. If you know a halal restaurant that might want to offer
        free meals to neighbors in need, share FreeHalalMeal.com with them.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={handleShare} className="btn-accent">
          Share with a restaurant
        </button>
        <a href="/partner/signup" className="btn-outline">
          I own a restaurant
        </a>
      </div>
    </div>
  );
}
