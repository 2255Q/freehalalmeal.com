import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (App Router server components / route handlers).
 * Uses anon key with RLS — respects the user's session.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Calling set from a Server Component throws; safe to ignore
            // when middleware refreshes the session.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {}
        },
      },
    },
  );
}

/**
 * Service-role client — bypasses RLS. Only call from server code.
 * Use sparingly: voucher creation, admin tasks.
 */
import { createClient as createPlainClient } from '@supabase/supabase-js';
export function createServiceClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
