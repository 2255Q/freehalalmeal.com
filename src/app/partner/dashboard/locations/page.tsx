import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Location } from '@/lib/types';
import { LocationsManager } from './LocationsManager';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true });

  // Per-location today's voucher count.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const counts: Record<string, number> = {};
  if (locations && locations.length > 0) {
    const ids = locations.map((l) => l.id);
    const { data: vouchersToday } = await supabase
      .from('vouchers')
      .select('location_id')
      .eq('restaurant_id', restaurant.id)
      .in('status', ['issued', 'redeemed'])
      .gte('issued_at', todayStart.toISOString())
      .in('location_id', ids);
    for (const row of vouchersToday ?? []) {
      const lid = (row as { location_id: string | null }).location_id;
      if (lid) counts[lid] = (counts[lid] ?? 0) + 1;
    }
  }

  return (
    <LocationsManager
      locations={(locations as Location[]) ?? []}
      todayCounts={counts}
    />
  );
}
