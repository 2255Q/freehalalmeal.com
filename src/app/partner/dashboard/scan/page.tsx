import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Scanner } from './Scanner';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) redirect('/partner/dashboard/setup');

  return <Scanner />;
}
