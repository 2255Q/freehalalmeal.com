import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://freehalalmeal.com'),
  title: {
    default: 'FreeHalalMeal.com — Free halal meals for humanity',
    template: '%s · FreeHalalMeal.com',
  },
  description:
    'A community-powered network of halal restaurants offering free meals to neighbors in need. No questions asked. No barriers — just kindness.',
  openGraph: {
    title: 'FreeHalalMeal.com — Free halal meals for humanity',
    description:
      'Find a participating halal restaurant near you and claim a free meal voucher. No questions asked.',
    type: 'website',
    siteName: 'FreeHalalMeal.com',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
