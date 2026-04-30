import type { Metadata } from 'next';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PrintButton } from '@/components/PrintButton';
import { createServiceClient } from '@/lib/supabase/server';
import type { Location, Restaurant, Voucher } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { code: string };
}

interface VoucherWithRels extends Voucher {
  restaurants: Pick<Restaurant, 'id' | 'name' | 'slug' | 'cuisine' | 'logo_url'> | null;
  locations:
    | (Pick<
        Location,
        | 'id'
        | 'label'
        | 'address_line1'
        | 'address_line2'
        | 'city'
        | 'region'
        | 'postal_code'
        | 'country'
        | 'latitude'
        | 'longitude'
        | 'phone'
        | 'available_from'
        | 'available_until'
      >)
    | null;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://freehalalmeal.com'
  );
}

function statusInfo(v: VoucherWithRels) {
  const now = new Date();
  const expired = new Date(v.expires_at) < now;
  const realStatus = v.status === 'issued' && expired ? 'expired' : v.status;
  switch (realStatus) {
    case 'redeemed':
      return {
        label: 'Redeemed',
        tone: 'bg-ink-100 text-ink-700 border-ink-200',
        message: 'This voucher has been used. Thank you.',
      };
    case 'expired':
      return {
        label: 'Expired',
        tone: 'bg-accent-100 text-accent-800 border-accent-200',
        message: 'This voucher is no longer valid. You can claim another one.',
      };
    case 'voided':
      return {
        label: 'Voided',
        tone: 'bg-ink-100 text-ink-700 border-ink-200',
        message: 'This voucher was voided.',
      };
    default:
      return {
        label: 'Valid',
        tone: 'bg-brand-100 text-brand-800 border-brand-200',
        message: 'Show this voucher at the restaurant to redeem.',
      };
  }
}

async function loadVoucher(code: string): Promise<VoucherWithRels | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `*,
       restaurants:restaurant_id (id, name, slug, cuisine, logo_url),
       locations:location_id (
         id, label, address_line1, address_line2, city, region, postal_code, country,
         latitude, longitude, phone, available_from, available_until
       )`,
    )
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (error) {
    console.error('[voucher view] load error:', error);
    return null;
  }
  return data as unknown as VoucherWithRels | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Voucher ${params.code.toUpperCase()}`,
    robots: { index: false },
  };
}

export default async function VoucherPage({ params }: PageProps) {
  const voucher = await loadVoucher(params.code);

  if (!voucher) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="container-page py-20 max-w-xl text-center">
            <h1 className="font-display text-4xl text-ink-900">Voucher not found</h1>
            <p className="mt-3 text-ink-600">
              We couldn&rsquo;t find a voucher with that code. Please check the link or
              your email — codes look like <code className="font-mono">HAL-XXXX-XXX</code>.
            </p>
            <Link href="/restaurants" className="btn-primary mt-6">
              Browse restaurants
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const status = statusInfo(voucher);
  const voucherUrl = `${siteUrl()}/voucher/${voucher.code}`;
  const qrDataUrl = await QRCode.toDataURL(voucherUrl, { margin: 1, width: 480 });

  const r = voucher.restaurants;
  const l = voucher.locations;

  const issuedAt = new Date(voucher.issued_at);
  const expiresAt = new Date(voucher.expires_at);

  const addressBits = l
    ? [
        l.address_line1,
        l.address_line2,
        [l.city, l.region].filter(Boolean).join(', '),
        [l.postal_code, l.country].filter(Boolean).join(' '),
      ].filter(Boolean)
    : [];

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="flex-1">
        <div className="container-page py-10 print:py-0 max-w-3xl">
          {/* Top action bar — hidden in print */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
            >
              <span aria-hidden>←</span> Browse restaurants
            </Link>
            <PrintButton />
          </div>

          {/* Voucher card — printable */}
          <article className="card overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-6 text-white print:bg-brand-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-brand-100">
                    FreeHalalMeal.com
                  </p>
                  <p className="font-display text-xl mt-1">Free Halal Meal Voucher</p>
                </div>
                <span aria-hidden className="font-display text-3xl">
                  ﷽
                </span>
              </div>
            </div>

            <div className="p-8 print:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status.label === 'Valid' ? 'bg-brand-600' : 'bg-current'
                    }`}
                  />
                  {status.label}
                </span>
                {r?.cuisine && <span className="badge">{r.cuisine}</span>}
              </div>

              <div className="mt-5 grid gap-8 sm:grid-cols-[1fr_auto] items-start">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-500">
                    Restaurant
                  </p>
                  <p className="mt-1 font-display text-2xl sm:text-3xl text-ink-900 leading-tight">
                    {r?.name ?? 'Restaurant'}
                  </p>

                  <p className="mt-5 text-xs uppercase tracking-wider text-ink-500">
                    Meal
                  </p>
                  <p className="mt-1 font-semibold text-ink-900 text-lg">
                    {voucher.menu_item_name}
                  </p>

                  {l && (
                    <>
                      <p className="mt-5 text-xs uppercase tracking-wider text-ink-500">
                        Location
                      </p>
                      <p className="mt-1 font-semibold text-ink-900">{l.label}</p>
                      <address className="mt-1 not-italic text-sm text-ink-600 leading-relaxed">
                        {addressBits.map((line, i) => (
                          <span key={i} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Voucher QR code"
                    className="h-44 w-44 sm:h-52 sm:w-52 print:h-56 print:w-56 rounded-2xl border border-ink-100 bg-white p-2"
                  />
                  <p className="mt-2 text-xs text-ink-500">Scan to verify</p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 px-6 py-5 text-center print:bg-white">
                <p className="text-xs uppercase tracking-widest text-brand-700 font-semibold">
                  Voucher code
                </p>
                <p className="mt-2 font-mono text-3xl sm:text-4xl print:text-4xl font-bold text-ink-900 tracking-widest">
                  {voucher.code}
                </p>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm border-t border-ink-100 pt-6">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-500">
                    Issued
                  </dt>
                  <dd className="mt-1 text-ink-800 font-medium">
                    {issuedAt.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-500">
                    Valid until
                  </dt>
                  <dd className="mt-1 text-ink-800 font-medium">
                    {expiresAt.toLocaleString()}
                  </dd>
                </div>
              </dl>

              <p className="mt-6 text-sm text-ink-600 leading-relaxed">
                {status.message}
              </p>

              <div className="mt-6 rounded-2xl bg-cream-100 p-5 text-sm text-ink-700 print:bg-white print:border print:border-ink-100">
                <p className="font-semibold text-ink-900">How to redeem</p>
                <ol className="mt-2 space-y-1 list-decimal pl-5 leading-relaxed">
                  <li>Visit {r?.name ?? 'the restaurant'} during open hours.</li>
                  <li>Show this voucher (printed or on your phone).</li>
                  <li>Staff scans the QR or enters the code.</li>
                  <li>Enjoy your meal — no payment required.</li>
                </ol>
              </div>

              <p className="mt-6 text-xs text-ink-500 italic text-center print:mt-4">
                Feeding people is among the noblest acts. May this meal bring you ease.
              </p>
            </div>
          </article>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <PrintButton />
            {r && (
              <Link href={`/restaurants/${r.slug}`} className="btn-outline">
                View restaurant
              </Link>
            )}
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
      {/* Print stylesheet helpers */}
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
