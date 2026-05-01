import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refresh Supabase session on every request so server components have a fresh user.
 *
 * Uses the getAll/setAll cookie API — required for PKCE code-verifier cookies
 * to round-trip correctly during magic-link / OAuth flows.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror the cookies into both the incoming request and the
          // outgoing response so downstream handlers and the browser see
          // the freshly written values.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser.
  // A bug here can cause the session to silently fail to refresh.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, fonts, images
     */
    '/((?!_next/static|_next/image|favicon|.*\\..*).*)',
  ],
};
