import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (App Router server components / route handlers).
 * Uses anon key with RLS — respects the user's session.
 *
 * Uses the getAll/setAll cookie API (preferred over get/set/remove) — this is
 * the canonical pattern for @supabase/ssr 0.5+ and is required for PKCE
 * code-verifier cookies to round-trip correctly between the browser and
 * server during OAuth/magic-link flows.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Calling set from a Server Component throws; safe to ignore
            // when middleware refreshes the session.
          }
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
