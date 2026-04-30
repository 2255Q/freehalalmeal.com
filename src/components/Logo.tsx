import Link from 'next/link';

export function Logo({ className = '', mark = 'green' }: { className?: string; mark?: 'green' | 'white' }) {
  const bg = mark === 'green' ? 'bg-brand-600' : 'bg-white';
  const stroke = mark === 'green' ? '#ffffff' : '#059669';
  const text = mark === 'green' ? 'text-ink-900' : 'text-white';
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`} aria-label="FreeHalalMeal.com home">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} shadow-soft transition-transform group-hover:scale-105`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized fork + olive branch */}
          <path d="M7 3v8a3 3 0 0 0 3 3v7" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M10 3v6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3c2 4-1 8-3 9 0-3 0-6 3-9z" fill={stroke} />
        </svg>
      </span>
      <span className={`font-display text-lg font-semibold tracking-tight ${text}`}>
        FreeHalalMeal<span className="text-brand-600 group-hover:text-accent-500 transition-colors">.com</span>
      </span>
    </Link>
  );
}
