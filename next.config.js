/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress the default `X-Powered-By: Next.js` response header — small
  // fingerprint reduction, no functional impact.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    // Bundle the Noto Naskh Arabic TTF into the serverless function for the
    // voucher claim API, so PDF generation can read it via fs.readFileSync.
    // Required because Next.js's automatic file tracing doesn't follow
    // dynamic fs.readFileSync paths.
    outputFileTracingIncludes: {
      '/api/vouchers/claim': ['./src/lib/fonts/**/*'],
    },
  },
  // Security headers applied to every route. CSP is intentionally not set
  // here — Next.js's inline scripts/styles need a nonce-based CSP that
  // requires per-request middleware work; defer until after launch.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent the site from being framed (clickjacking defense).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stop browsers from MIME-sniffing responses.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs to third parties.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser APIs we don't use (camera/mic/geolocation/etc).
          // Add new entries only when a feature actually needs them.
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Force HTTPS on this domain + subdomains for 1 year. Add
          // `; preload` and submit to hstspreload.org once you're sure
          // every subdomain is HTTPS-only.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
