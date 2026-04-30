'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

export interface RestaurantMapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
  city?: string;
}

interface RestaurantMapProps {
  markers: RestaurantMapMarker[];
  onMarkerClick?: (id: string) => void;
  highlightedId?: string;
  height?: string;
}

function makePinIcon(highlighted: boolean) {
  // brand-600 = #059669, accent-500 = #f97316
  const fill = highlighted ? '#f97316' : '#059669';
  const ring = highlighted ? '#fed7aa' : '#a7f3d0';
  const html = `
    <div style="position:relative;width:32px;height:42px;">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(15,23,42,0.35)" />
          </filter>
        </defs>
        <path filter="url(#pinShadow)" fill="${fill}" stroke="white" stroke-width="2"
          d="M16 1c8.3 0 15 6.7 15 15 0 10.5-13 24-14.3 25.4a1 1 0 0 1-1.4 0C13.9 39.9 1 26.5 1 16 1 7.7 7.7 1 16 1z"/>
        <circle cx="16" cy="16" r="5.5" fill="white" />
        <circle cx="16" cy="16" r="3" fill="${fill}" />
      </svg>
      ${
        highlighted
          ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:3px solid ${ring};animation:pulse 1.4s ease-out infinite;"></div>`
          : ''
      }
    </div>
  `;
  return L.divIcon({
    html,
    className: 'fhm-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

function FitToMarkers({ markers }: { markers: RestaurantMapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [markers, map]);
  return null;
}

export default function RestaurantMap({
  markers,
  onMarkerClick,
  highlightedId,
  height = '100%',
}: RestaurantMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [20, 0];
    const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [avgLat, avgLng];
  }, [markers]);

  const zoom = markers.length === 0 ? 2 : markers.length === 1 ? 13 : 5;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.9; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .fhm-marker { background: transparent !important; border: none !important; }
        .leaflet-container {
          font-family: var(--font-sans);
          border-radius: 1.5rem;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(15,23,42,0.08), 0 16px 48px rgba(15,23,42,0.10);
        }
        .leaflet-popup-content { margin: 14px 16px; }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height, width: '100%', minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers markers={markers} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={makePinIcon(highlightedId === m.id)}
            eventHandlers={{
              click: () => onMarkerClick?.(m.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-display text-base font-semibold text-ink-900 leading-tight">
                  {m.name}
                </div>
                {m.city && <div className="mt-0.5 text-xs text-ink-500">{m.city}</div>}
                <Link
                  href={`/restaurants/${m.slug}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  View menu
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
