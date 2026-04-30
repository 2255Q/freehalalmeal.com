import Link from 'next/link';
import type { Restaurant, Location } from '@/lib/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  locations?: Location[];
  /** Optional explicit count override (e.g. when caller has it precomputed) */
  locationCount?: number;
  /** Optional explicit primary city override */
  primaryCity?: string;
  /** Highlighted hover state (used by browse page) */
  highlighted?: boolean;
  /** Optional mouse handlers for interactive list <-> map sync */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t: string | null | undefined) {
  if (!t) return '';
  // Accept "11:00:00" or "11:00"
  const [h, m] = t.split(':');
  const hour = Number(h);
  const min = Number(m);
  if (Number.isNaN(hour)) return t;
  const period = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  if (min === 0) return `${h12}${period}`;
  return `${h12}:${String(min).padStart(2, '0')}${period}`;
}

function isAvailableToday(loc: Location, now = new Date()) {
  const dow = now.getDay();
  return loc.available_days?.includes(dow) ?? true;
}

export function RestaurantCard({
  restaurant,
  locations = [],
  locationCount,
  primaryCity,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
}: RestaurantCardProps) {
  const count = locationCount ?? locations.length;
  const primary = locations[0];
  const city = primaryCity ?? primary?.city ?? '';
  const country = primary?.country ?? '';
  const cityLine = [city, country].filter(Boolean).join(', ');

  const availableToday = primary ? isAvailableToday(primary) : true;
  const hours =
    primary && availableToday
      ? `${formatTime(primary.available_from)}–${formatTime(primary.available_until)}`
      : null;

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`card group transition-all duration-200 hover:shadow-lift ${
        highlighted ? 'ring-2 ring-brand-500 shadow-lift' : ''
      }`}
    >
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700">
          {restaurant.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.cover_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-pattern">
              <span className="font-display text-4xl text-white/90">
                {restaurant.name.charAt(0)}
              </span>
            </div>
          )}
          {restaurant.cuisine && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-ink-800 shadow-soft backdrop-blur">
              {restaurant.cuisine}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl text-ink-900 leading-tight truncate">
                {restaurant.name}
              </h3>
              {cityLine && (
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                  <svg
                    className="h-3.5 w-3.5 flex-none text-ink-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">{cityLine}</span>
                </p>
              )}
            </div>
          </div>

          {restaurant.description && (
            <p className="mt-3 text-sm text-ink-600 line-clamp-2 leading-relaxed">
              {restaurant.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {count > 1 && (
              <span className="badge">
                {count} location{count === 1 ? '' : 's'}
              </span>
            )}
            {hours && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
                <svg
                  className="h-3.5 w-3.5 text-brand-600"
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
                Today {hours}
              </span>
            )}
            {!availableToday && primary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                Next open: {DAY_NAMES[primary.available_days[0] ?? 0]}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
              View menu
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
