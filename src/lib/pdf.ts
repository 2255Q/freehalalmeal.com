import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

interface VoucherPdfProps {
  voucherCode: string;
  restaurantName: string;
  menuItemName: string;
  locationLabel?: string;
  locationAddress?: string;
  expiresAt: Date;
  redeemUrl: string;
}

export async function generateVoucherPdf({
  voucherCode,
  restaurantName,
  menuItemName,
  locationLabel,
  locationAddress,
  expiresAt,
  redeemUrl,
}: VoucherPdfProps): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  // 612 x 792 = US Letter
  const page = pdf.addPage([612, 792]);

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const green = rgb(0.02, 0.59, 0.41);
  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.4, 0.45, 0.55);
  const cream = rgb(1.0, 0.99, 0.97);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: cream });

  // Top green band
  page.drawRectangle({ x: 0, y: 692, width: 612, height: 100, color: green });
  page.drawText('FreeHalalMeal.com', {
    x: 40, y: 740, size: 22, font: times, color: rgb(1, 1, 1),
  });
  page.drawText('Free Halal Meal Voucher', {
    x: 40, y: 715, size: 11, font: helv, color: rgb(0.85, 0.95, 0.9),
  });
  // Romanized Bismillah — pdf-lib's Standard Helvetica is WinAnsi-only and
  // can't encode the single-glyph ﷽ (U+FDFD). We use the romanization for now
  // to keep the spiritual framing visible in the PDF; embedding a Unicode
  // Arabic font (e.g. Noto Naskh) is a follow-up polish item.
  page.drawText('Bismillah', {
    x: 478, y: 738, size: 16, font: times, color: rgb(1, 1, 1),
  });

  // Voucher box
  const boxX = 40, boxY = 380, boxW = 532, boxH = 280;
  page.drawRectangle({
    x: boxX, y: boxY, width: boxW, height: boxH,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1,
  });

  // Restaurant + meal
  page.drawText('Restaurant', { x: boxX + 32, y: boxY + boxH - 40, size: 9, font: helv, color: muted });
  page.drawText(restaurantName, { x: boxX + 32, y: boxY + boxH - 60, size: 18, font: helvBold, color: ink });

  page.drawText('Meal', { x: boxX + 32, y: boxY + boxH - 92, size: 9, font: helv, color: muted });
  page.drawText(menuItemName, { x: boxX + 32, y: boxY + boxH - 112, size: 14, font: helvBold, color: ink });

  if (locationLabel) {
    page.drawText('Location', { x: boxX + 32, y: boxY + boxH - 144, size: 9, font: helv, color: muted });
    page.drawText(locationLabel, { x: boxX + 32, y: boxY + boxH - 162, size: 11, font: helvBold, color: ink });
    if (locationAddress) {
      page.drawText(locationAddress, { x: boxX + 32, y: boxY + boxH - 178, size: 10, font: helv, color: muted });
    }
  }

  page.drawText('Valid until', { x: boxX + 32, y: boxY + 50, size: 9, font: helv, color: muted });
  page.drawText(expiresAt.toLocaleString(), { x: boxX + 32, y: boxY + 32, size: 11, font: helvBold, color: ink });

  // QR code on the right side
  const qrDataUrl = await QRCode.toDataURL(redeemUrl, { margin: 1, width: 320 });
  const qrPng = await pdf.embedPng(qrDataUrl);
  page.drawImage(qrPng, { x: boxX + boxW - 172, y: boxY + 60, width: 140, height: 140 });
  page.drawText('Scan to redeem', { x: boxX + boxW - 154, y: boxY + 44, size: 9, font: helv, color: muted });

  // Voucher code band
  page.drawRectangle({ x: 40, y: 320, width: 532, height: 50, color: rgb(0.92, 0.99, 0.95) });
  page.drawText('Voucher code', { x: 60, y: 350, size: 9, font: helv, color: green });
  page.drawText(voucherCode, { x: 60, y: 332, size: 20, font: helvBold, color: ink });

  // Instructions
  page.drawText('How to redeem', { x: 40, y: 280, size: 12, font: helvBold, color: ink });
  const lines = [
    '1. Visit the restaurant during their open hours.',
    '2. Show this voucher (printed or on your phone) to the staff.',
    '3. Staff scans the QR code or enters the voucher code to redeem.',
    '4. Enjoy your meal — no payment required.',
  ];
  lines.forEach((line, i) => {
    page.drawText(line, { x: 40, y: 258 - i * 16, size: 10, font: helv, color: ink });
  });

  // Footer / dignity message
  page.drawText('Feeding people is among the noblest acts. May this meal bring you ease.', {
    x: 40, y: 70, size: 10, font: helv, color: muted,
  });
  page.drawText('FreeHalalMeal.com · One voucher, one meal, infinite kindness.', {
    x: 40, y: 50, size: 9, font: helv, color: muted,
  });

  return pdf.save();
}
