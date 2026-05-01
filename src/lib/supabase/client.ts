'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase (browser). Uses anon key + RLS.
 *
 * Explicit cookieOptions ensure the PKCE code-verifier cookie is set with
 * Path=/ and Secure attributes so it survives the cross-site redirect from
 * Supabase's auth/verify endpoint back to /partner/callback (where
 * exchangeCodeForSession reads it on the server). Without Secure, modern
 * browsers may strip the cookie on cross-origin top-level navigations
 * even when SameSite=Lax should permit it.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: true,
        // 1 year — matches Supabase default refresh-token lifetime.
        maxAge: 60 * 60 * 24 * 365,
      },
    },
  );
}
