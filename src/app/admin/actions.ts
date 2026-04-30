'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { RestaurantStatus } from '@/lib/types';

/**
 * Re-checks admin permission on every server action — never trust the layout
 * alone; mutations must independently verify the caller.
 *
 * Returns the authenticated user's email (lowercased) on success, throws
 * otherwise.
 */
async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const email = (user.email ?? '').toLowerCase();

  const { data: row } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  const bootstrap = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!row && !bootstrap.includes(email)) {
    throw new Error('Not authorized');
  }
  return { userId: user.id, email };
}

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------

export async function setRestaurantStatus(id: string, status: RestaurantStatus) {
  await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc
    .from('restaurants')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/restaurants');
  revalidatePath(`/admin/restaurants/${id}`);
  revalidatePath('/admin');
}

export async function deleteRestaurant(id: string) {
  await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc.from('restaurants').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/restaurants');
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Vouchers
// ---------------------------------------------------------------------------

export async function voidVoucher(id: string) {
  await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc
    .from('vouchers')
    .update({ status: 'voided' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/vouchers');
  revalidatePath('/admin');
}

export async function markVoucherRedeemed(id: string) {
  const { userId } = await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc
    .from('vouchers')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: userId,
      notes: 'Manually marked redeemed by admin',
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/vouchers');
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Blocked emails
// ---------------------------------------------------------------------------

export async function addBlockedEmail(formData: FormData) {
  const { userId } = await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const reason = String(formData.get('reason') ?? '').trim() || null;
  if (!email) throw new Error('Email required');

  const svc = createServiceClient();
  const { error } = await svc
    .from('blocked_emails')
    .upsert({ email, reason, blocked_by: userId, blocked_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/blocked-emails');
  revalidatePath('/admin');
}

export async function removeBlockedEmail(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) throw new Error('Email required');

  const svc = createServiceClient();
  const { error } = await svc.from('blocked_emails').delete().eq('email', email);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/blocked-emails');
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Blocked IPs
// ---------------------------------------------------------------------------

export async function addBlockedIp(formData: FormData) {
  const { userId } = await requireAdmin();
  const ip = String(formData.get('ip') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim() || null;
  if (!ip) throw new Error('IP required');

  const svc = createServiceClient();
  const { error } = await svc
    .from('blocked_ips')
    .upsert({ ip, reason, blocked_by: userId, blocked_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/blocked-ips');
  revalidatePath('/admin');
}

export async function removeBlockedIp(formData: FormData) {
  await requireAdmin();
  const ip = String(formData.get('ip') ?? '').trim();
  if (!ip) throw new Error('IP required');

  const svc = createServiceClient();
  const { error } = await svc.from('blocked_ips').delete().eq('ip', ip);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/blocked-ips');
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------

export async function addAdmin(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) throw new Error('Email required');

  const svc = createServiceClient();
  const { error } = await svc.from('admins').upsert({ email });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/admins');
}

export async function removeAdmin(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) throw new Error('Email required');

  const svc = createServiceClient();
  const { error } = await svc.from('admins').delete().eq('email', email);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/admins');
}
