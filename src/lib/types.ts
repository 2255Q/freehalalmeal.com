/**
 * Shared TypeScript types for FreeHalalMeal.com
 */

export type RestaurantStatus = 'pending' | 'active' | 'suspended';
export type VoucherStatus = 'issued' | 'redeemed' | 'expired' | 'voided';

export interface Restaurant {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  phone: string | null;
  email: string;
  status: RestaurantStatus;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  restaurant_id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  daily_meal_limit: number;
  available_from: string;
  available_until: string;
  available_days: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  email: string;
  ip_address: string | null;
  restaurant_id: string;
  location_id: string | null;
  menu_item_id: string | null;
  menu_item_name: string;
  status: VoucherStatus;
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  notes: string | null;
}
