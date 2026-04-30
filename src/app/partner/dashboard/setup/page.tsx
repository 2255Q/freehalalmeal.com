import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SetupWizard } from './SetupWizard';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const suffix = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36)).slice(0, 6);
  return `${base || 'restaurant'}-${suffix}`;
}

export default async function SetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  let { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  // If no restaurant exists yet, create a minimal stub so the wizard has a row
  // to update. This is a defensive fallback; the normal callback flow creates it.
  if (!restaurant) {
    const fallbackName = (user.email ?? 'My Restaurant').split('@')[0] || 'My Restaurant';
    const slug = slugify(fallbackName);
    const { data: created, error: insertErr } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        slug,
        name: fallbackName,
        email: user.email ?? '',
        status: 'active',
      })
      .select('*')
      .maybeSingle();
    if (insertErr || !created) {
      // If we can't create a row, fall back to login.
      redirect('/partner/login');
    }
    restaurant = created;
  }

  if (!restaurant) redirect('/partner/login');

  const { count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id);

  const { count: menuCount } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id);

  // Pick the first incomplete step.
  let initialStep: 1 | 2 | 3 = 1;
  if (restaurant.description || restaurant.cuisine) initialStep = 2;
  if ((locationCount ?? 0) > 0) initialStep = 3;
  if ((menuCount ?? 0) > 0) initialStep = 3;

  return (
    <SetupWizard
      restaurant={restaurant}
      initialStep={initialStep}
      hasLocation={(locationCount ?? 0) > 0}
      hasMenuItem={(menuCount ?? 0) > 0}
    />
  );
}
