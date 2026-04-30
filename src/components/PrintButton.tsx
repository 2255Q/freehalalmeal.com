'use client';

interface PrintButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function PrintButton({ className = 'btn-outline', children }: PrintButtonProps) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      {children ?? 'Print voucher'}
    </button>
  );
}
