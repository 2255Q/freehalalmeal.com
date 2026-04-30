/**
 * Email sending via Brevo's transactional email API.
 *
 * Why Brevo: free tier supports multiple verified domains (Resend's free tier is 1).
 * API: https://developers.brevo.com/reference/sendtransacemail
 *
 * Required env vars:
 *   BREVO_API_KEY        — generated at https://app.brevo.com/settings/keys/api
 *   BREVO_FROM_EMAIL     — e.g. "vouchers@freehalalmeal.com"  (must be verified in Brevo)
 *   BREVO_FROM_NAME      — display name, e.g. "FreeHalalMeal.com"
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface VoucherEmailProps {
  to: string;
  voucherCode: string;
  restaurantName: string;
  menuItemName: string;
  expiresAt: Date;
  voucherUrl: string;
  pdfBuffer: Buffer | Uint8Array;
}

function envOrNull(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

function bufferToBase64(buf: Buffer | Uint8Array): string {
  if (Buffer.isBuffer(buf)) return buf.toString('base64');
  return Buffer.from(buf).toString('base64');
}

export async function sendVoucherEmail({
  to,
  voucherCode,
  restaurantName,
  menuItemName,
  expiresAt,
  voucherUrl,
  pdfBuffer,
}: VoucherEmailProps) {
  const apiKey = envOrNull('BREVO_API_KEY');
  const fromEmail = envOrNull('BREVO_FROM_EMAIL') ?? 'vouchers@freehalalmeal.com';
  const fromName = envOrNull('BREVO_FROM_NAME') ?? 'FreeHalalMeal.com';

  if (!apiKey) {
    console.warn(
      '[email] BREVO_API_KEY not set; skipping email send. Voucher is still issued.',
    );
    return { skipped: true } as const;
  }

  const html = `
  <!DOCTYPE html>
  <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fffdf7;padding:24px;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;">
      <div style="background:#059669;padding:32px;color:white;text-align:center;">
        <div style="font-size:14px;letter-spacing:0.06em;text-transform:uppercase;opacity:0.85;">Your Free Halal Meal Voucher</div>
        <div style="font-size:28px;font-weight:600;margin-top:8px;">Bismillah — enjoy your meal</div>
      </div>
      <div style="padding:32px;">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
          Assalamu alaikum,
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
          Your voucher for <strong>${menuItemName}</strong> at <strong>${restaurantName}</strong> is ready.
          Show this email or the attached PDF at the restaurant — they will scan or enter your code.
        </p>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:20px;text-align:center;margin:20px 0;">
          <div style="font-size:12px;color:#047857;letter-spacing:0.08em;text-transform:uppercase;">Voucher code</div>
          <div style="font-family:monospace;font-size:28px;font-weight:700;color:#064e3b;letter-spacing:0.1em;margin-top:4px;">${voucherCode}</div>
        </div>
        <p style="font-size:14px;color:#475569;line-height:1.6;">
          This voucher is valid until <strong>${expiresAt.toLocaleString()}</strong>. It can only be used once.
        </p>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${voucherUrl}" style="display:inline-block;background:#f97316;color:white;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;">View / print voucher</a>
        </div>
        <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:24px;">
          Feeding people is among the noblest acts in our tradition. May this meal nourish you and bring you ease.
        </p>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:12px;color:#64748b;">
        FreeHalalMeal.com · Free halal meals for humanity
      </div>
    </div>
  </body></html>`;

  const body = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to }],
    subject: `Your free meal voucher · ${restaurantName}`,
    htmlContent: html,
    attachment: [
      {
        name: `voucher-${voucherCode}.pdf`,
        content: bufferToBase64(pdfBuffer),
      },
    ],
  };

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[email] Brevo send failed:', res.status, text);
    // Don't throw — we don't want to fail the voucher claim if email is broken.
    return { error: true, status: res.status } as const;
  }

  const json = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { messageId: json.messageId };
}
