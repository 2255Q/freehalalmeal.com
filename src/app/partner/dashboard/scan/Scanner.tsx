'use client';

import { useState } from 'react';

type LookupResult = {
  voucher: {
    id: string;
    code: string;
    email: string;
    menu_item_name: string;
    status: string;
    issued_at: string;
    expires_at: string;
    redeemed_at: string | null;
  };
  status: 'issued' | 'redeemed' | 'expired' | 'voided';
};

type ApiResponse =
  | { ok: true; voucher: LookupResult['voucher']; redeemed: boolean }
  | { ok: false; code: 'not_found' | 'wrong_restaurant' | 'expired' | 'already_redeemed' | 'error'; message: string; voucher?: LookupResult['voucher'] };

function maskEmail(email: string): string {
  return email.replace(/^(.).+(@.+)$/, '$1***$2');
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function Scanner() {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch('/api/partner/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), confirm: false }),
      });
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setPending(false);
    }
  }

  async function confirmRedeem() {
    if (!result || !result.ok) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/partner/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), confirm: true }),
      });
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setCode('');
    setResult(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl text-ink-900">Scan voucher</h1>
        <p className="mt-2 text-ink-600">Enter the code from a guest&rsquo;s voucher to verify and redeem it.</p>
      </header>

      <div className="card p-6">
        <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="HAL-XXXX-XXX"
            autoFocus
            spellCheck={false}
            className="input font-mono tracking-wide text-lg flex-1"
          />
          <button type="submit" disabled={pending} className="btn-primary px-6">
            {pending ? 'Looking up…' : 'Look up voucher'}
          </button>
        </form>
        <p className="mt-3 text-xs text-ink-500">
          Camera scanning coming soon — for now please enter the code shown on the guest&rsquo;s voucher.
        </p>
      </div>

      {result && <ResultPanel result={result} confirming={confirming} onConfirm={confirmRedeem} onReset={reset} fmt={fmt} maskEmail={maskEmail} />}
    </div>
  );
}

function ResultPanel({
  result,
  confirming,
  onConfirm,
  onReset,
  fmt,
  maskEmail,
}: {
  result: ApiResponse;
  confirming: boolean;
  onConfirm: () => void;
  onReset: () => void;
  fmt: (iso: string | null) => string;
  maskEmail: (s: string) => string;
}) {
  // Success — newly redeemed
  if (result.ok && result.redeemed) {
    return (
      <div className="card border-2 border-brand-300 bg-brand-50/50 p-7 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
        </div>
        <h2 className="mt-5 font-display text-2xl text-brand-900">Redeemed — enjoy your meal!</h2>
        <p className="mt-2 text-brand-800">{result.voucher.menu_item_name}</p>
        <p className="mt-1 text-sm text-ink-600 font-mono">{result.voucher.code}</p>
        <button onClick={onReset} className="mt-6 btn-primary">
          Scan another
        </button>
      </div>
    );
  }

  // Pending confirmation — preview
  if (result.ok) {
    const v = result.voucher;
    return (
      <div className="card p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Zm0 13.036h.008v.008H12v-.008Z" /></svg>
          </span>
          <div>
            <h2 className="font-display text-xl text-ink-900">Voucher is valid</h2>
            <p className="text-sm text-ink-600">Confirm to mark it redeemed.</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Code</dt>
            <dd className="mt-1 font-mono text-ink-900">{v.code}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Meal</dt>
            <dd className="mt-1 text-ink-900">{v.menu_item_name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Email</dt>
            <dd className="mt-1 text-ink-700">{maskEmail(v.email)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Expires</dt>
            <dd className="mt-1 text-ink-700">{fmt(v.expires_at)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="btn-primary flex-1 text-base py-3"
          >
            {confirming ? 'Confirming…' : 'Confirm redemption'}
          </button>
          <button onClick={onReset} className="btn-outline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Error variants
  const messages: Record<typeof result.code, { title: string; body: string; tone: 'red' | 'ink' | 'accent' }> = {
    not_found: { title: 'Voucher not found', body: 'Double-check the code with your guest. Codes look like HAL-XXXX-XXX.', tone: 'red' },
    wrong_restaurant: { title: 'Voucher not valid here', body: 'This code isn\'t for your restaurant.', tone: 'red' },
    expired: { title: 'Voucher has expired', body: 'This voucher is past its expiration time.', tone: 'ink' },
    already_redeemed: {
      title: 'Already redeemed',
      body: result.voucher?.redeemed_at
        ? `Redeemed at ${fmt(result.voucher.redeemed_at)}.`
        : 'This voucher has already been used.',
      tone: 'accent',
    },
    error: { title: 'Something went wrong', body: result.message, tone: 'red' },
  };
  const info = messages[result.code];
  const toneCls =
    info.tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-900'
      : info.tone === 'accent'
      ? 'border-accent-200 bg-accent-50 text-accent-900'
      : 'border-ink-200 bg-ink-50 text-ink-900';

  return (
    <div className={`card border-2 ${toneCls} p-7 text-center`}>
      <h2 className="font-display text-2xl">{info.title}</h2>
      <p className="mt-2">{info.body}</p>
      <button onClick={onReset} className="mt-6 btn-outline">
        Try another code
      </button>
    </div>
  );
}
