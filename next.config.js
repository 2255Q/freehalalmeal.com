/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = nextConfig;
