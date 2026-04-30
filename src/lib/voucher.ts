/**
 * Voucher utilities — code generation, expiry, formatting.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ambiguity-free

/**
 * Generate a human-friendly voucher code: HAL-XXXX-XXX
 * ~32^7 ≈ 35 billion combinations; uniqueness is also enforced by DB constraint.
 */
export function generateVoucherCode(): string {
  const pick = (n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)))
      .map((x) => ALPHABET[x % ALPHABET.length])
      .join('');
  return `HAL-${pick(4)}-${pick(3)}`;
}

/** Default voucher validity window — 48 hours. */
export const VOUCHER_TTL_HOURS = 48;

export function voucherExpiry(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(d.getHours() + VOUCHER_TTL_HOURS);
  return d;
}

export function formatVoucherCode(code: string) {
  return code.toUpperCase();
}
