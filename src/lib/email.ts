import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'FreeHalalMeal.com <vouchers@freehalalmeal.com>';

interface VoucherEmailProps {
  to: string;
  voucherCode: string;
  restaurantName: string;
  menuItemName: string;
  expiresAt: Date;
  voucherUrl: string;
  pdfBuffer: Buffer;
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

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your free meal voucher · ${restaurantName}`,
    html,
    attachments: [
      {
        filename: `voucher-${voucherCode}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
