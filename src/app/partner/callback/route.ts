import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

function sanitizeName(raw: string): string {
  // Collapse whitespace, trim, cap length. Drop anything below ASCII space.
  return raw
    .split('')
    .filter((c) => c.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/**
 * Only allow internal redirects on `?next=` so we can't be open-redirected.
 */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawName = searchParams.get('name');
  const next = safeNext(searchParams.get('next'));
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    const url = new URL('/partner/login', origin);
    url.searchParams.set('error', errorDescription);
    if (next) url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/partner/login', origin));
  }

  const supabase = createClient();

  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    const url = new URL('/partner/login', origin);
    url.searchParams.set('error', exchangeErr.message);
    if (next) url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/partner/login', origin));
  }

  // If the caller asked us to land somewhere specific (e.g. admin), honor it.
  if (next) {
    return NextResponse.redirect(new URL(next, origin));
  }

  // See if the user already has a restaurant.
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id, slug')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(new URL('/partner/dashboard', origin));
  }

  // Signup flow — create the restaurant row now that email is verified.
  if (rawName) {
    const name = sanitizeName(rawName);
    if (name) {
      const slug = slugify(name);
      const { error: insertErr } = await supabase.from('restaurants').insert({
        owner_id: user.id,
        slug,
        name,
        email: user.email ?? '',
        // Auto-approve: user just verified email by clicking the magic link.
        status: 'active',
      });

      if (insertErr) {
        // If something failed (e.g. slug collision), nudge them to setup
        // where they can complete a profile manually next attempt.
        const url = new URL('/partner/dashboard/setup', origin);
        url.searchParams.set('error', insertErr.message);
        return NextResponse.redirect(url);
      }

      return NextResponse.redirect(new URL('/partner/dashboard/setup', origin));
    }
  }

  // Returning user with no restaurant — send to setup.
  return NextResponse.redirect(new URL('/partner/dashboard/setup', origin));
}
