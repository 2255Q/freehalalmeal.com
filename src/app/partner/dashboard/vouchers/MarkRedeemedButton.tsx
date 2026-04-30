'use client';

import { useState, useTransition } from 'react';
import { markVoucherRedeemed } from '@/app/partner/actions';

export function MarkRedeemedButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    const fd = new FormData();
    fd.set('id', id);
    startTransition(async () => {
      try {
        await markVoucherRedeemed(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed.');
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn-primary text-xs px-3 py-1.5"
      >
        {pending ? '…' : 'Mark redeemed'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
