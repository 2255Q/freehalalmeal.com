'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Helpers
// =============================================================================

async function requireOwnerRestaurant() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/partner/login');
  }
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user!.id)
    .maybeSingle();
  if (error) throw error;
  if (!restaurant) {
    redirect('/partner/dashboard/setup');
  }
  return { supabase, user: user!, restaurant: restaurant! };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function getNumber(v: FormDataEntryValue | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getPositiveIntOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (!s.length) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function getIsoOrNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (!s.length) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// =============================================================================
// Restaurant
// =============================================================================

export async function updateRestaurant(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();

  const paused_from = getIsoOrNull(formData.get('paused_from'));
  const paused_until = getIsoOrNull(formData.get('paused_until'));
  if (paused_from && paused_until && paused_from > paused_until) {
    throw new Error('Pause window end must be after the start');
  }

  const patch = {
    name: String(formData.get('name') ?? '').trim() || restaurant.name,
    description: emptyToNull(formData.get('description')),
    cuisine: emptyToNull(formData.get('cuisine')),
    logo_url: emptyToNull(formData.get('logo_url')),
    cover_url: emptyToNull(formData.get('cover_url')),
    website: emptyToNull(formData.get('website')),
    phone: emptyToNull(formData.get('phone')),
    email: String(formData.get('email') ?? '').trim() || restaurant.email,
    monthly_meal_limit: getPositiveIntOrNull(formData.get('monthly_meal_limit')),
    paused_from,
    paused_until,
  };

  const { error } = await supabase
    .from('restaurants')
    .update(patch)
    .eq('id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard', 'layout');
  revalidatePath('/partner/dashboard/settings');
}

export async function pauseRestaurant() {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  if (restaurant.status === 'suspended') {
    throw new Error('Suspended accounts cannot be self-managed. Contact support.');
  }
  const { error } = await supabase
    .from('restaurants')
    .update({ status: 'paused' })
    .eq('id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard', 'layout');
  revalidatePath('/partner/dashboard/settings');
}

export async function resumeRestaurant() {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  if (restaurant.status === 'suspended') {
    throw new Error('Suspended accounts cannot be self-managed. Contact support.');
  }
  const { error } = await supabase
    .from('restaurants')
    .update({ status: 'active' })
    .eq('id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard', 'layout');
  revalidatePath('/partner/dashboard/settings');
}

// =============================================================================
// Locations
// =============================================================================

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function readLocationFields(formData: FormData) {
  const days: number[] = [];
  for (const d of ALL_DAYS) {
    if (formData.get(`day_${d}`) === 'on') days.push(d);
  }

  return {
    label: String(formData.get('label') ?? '').trim(),
    address_line1: String(formData.get('address_line1') ?? '').trim(),
    address_line2: emptyToNull(formData.get('address_line2')),
    city: String(formData.get('city') ?? '').trim(),
    region: emptyToNull(formData.get('region')),
    postal_code: emptyToNull(formData.get('postal_code')),
    country: String(formData.get('country') ?? '').trim().toUpperCase().slice(0, 2),
    latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
    longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
    phone: emptyToNull(formData.get('phone')),
    daily_meal_limit: getNumber(formData.get('daily_meal_limit'), 10),
    available_from: String(formData.get('available_from') ?? '11:00'),
    available_until: String(formData.get('available_until') ?? '20:00'),
    available_days: days.length ? days : ALL_DAYS,
    // If the form explicitly includes the toggle marker, honor the checkbox.
    // Otherwise default to true (e.g. wizard).
    is_active: formData.has('_has_is_active')
      ? formData.get('is_active') === 'on'
      : true,
  };
}

export async function createLocation(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const fields = readLocationFields(formData);

  const { error } = await supabase.from('locations').insert({
    restaurant_id: restaurant.id,
    ...fields,
  });
  if (error) throw error;

  revalidatePath('/partner/dashboard/locations');
  revalidatePath('/partner/dashboard');
}

export async function updateLocation(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing location id');
  const fields = readLocationFields(formData);

  const { error } = await supabase
    .from('locations')
    .update(fields)
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/locations');
}

export async function deleteLocation(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing location id');

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/locations');
}

export async function toggleLocationActive(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  const next = formData.get('is_active') === 'true';

  const { error } = await supabase
    .from('locations')
    .update({ is_active: next })
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/locations');
}

// =============================================================================
// Menu items
// =============================================================================

function readMenuFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: emptyToNull(formData.get('description')),
    image_url: emptyToNull(formData.get('image_url')),
    is_active: formData.has('_has_is_active')
      ? formData.get('is_active') === 'on'
      : true,
    sort_order: getNumber(formData.get('sort_order'), 0),
  };
}

export async function createMenuItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const fields = readMenuFields(formData);

  // figure out the next sort_order if not provided
  if (!formData.get('sort_order')) {
    const { data: rows } = await supabase
      .from('menu_items')
      .select('sort_order')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: false })
      .limit(1);
    fields.sort_order = (rows && rows[0]?.sort_order != null ? rows[0].sort_order : 0) + 10;
  }

  const { error } = await supabase.from('menu_items').insert({
    restaurant_id: restaurant.id,
    ...fields,
  });
  if (error) throw error;

  revalidatePath('/partner/dashboard/menu');
  revalidatePath('/partner/dashboard');
}

export async function updateMenuItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing menu item id');
  const fields = readMenuFields(formData);

  const { error } = await supabase
    .from('menu_items')
    .update(fields)
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/menu');
}

export async function deleteMenuItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing menu item id');

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/menu');
}

export async function reorderMenuItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (!id || !['up', 'down'].includes(direction)) throw new Error('Invalid reorder');

  const { data: items, error: listErr } = await supabase
    .from('menu_items')
    .select('id, sort_order')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true });
  if (listErr) throw listErr;
  if (!items) return;

  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[idx];
  const b = items[swapWith];

  await supabase.from('menu_items').update({ sort_order: b.sort_order }).eq('id', a.id);
  await supabase.from('menu_items').update({ sort_order: a.sort_order }).eq('id', b.id);

  revalidatePath('/partner/dashboard/menu');
}

export async function toggleMenuItemActive(formData: FormData) {
  const { supabase, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  const next = formData.get('is_active') === 'true';

  const { error } = await supabase
    .from('menu_items')
    .update({ is_active: next })
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;

  revalidatePath('/partner/dashboard/menu');
}

// =============================================================================
// Vouchers
// =============================================================================

export async function markVoucherRedeemed(formData: FormData) {
  const { supabase, user, restaurant } = await requireOwnerRestaurant();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing voucher id');

  const { data: v, error: getErr } = await supabase
    .from('vouchers')
    .select('id, status, expires_at, restaurant_id')
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();
  if (getErr) throw getErr;
  if (!v) throw new Error('Voucher not found');
  if (v.status !== 'issued') throw new Error(`Voucher is ${v.status}`);
  if (new Date(v.expires_at) < new Date()) throw new Error('Voucher is expired');

  const { error: updErr } = await supabase
    .from('vouchers')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: user.id,
    })
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);
  if (updErr) throw updErr;

  revalidatePath('/partner/dashboard/vouchers');
  revalidatePath('/partner/dashboard');
}
