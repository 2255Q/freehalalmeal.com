import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  return <SettingsForm restaurant={restaurant} />;
}
