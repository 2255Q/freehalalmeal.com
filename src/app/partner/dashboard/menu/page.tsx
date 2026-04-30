import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { MenuItem } from '@/lib/types';
import { MenuManager } from './MenuManager';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true });

  return <MenuManager items={(items as MenuItem[]) ?? []} />;
}
