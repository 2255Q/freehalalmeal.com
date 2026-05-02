import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';

// Load the Arabic font lazily on first use. The path is resolved against
// process.cwd() at call time (NOT at module init), so the resolution still
// works if cwd is changed before the first PDF is generated. process.cwd()
// is the project root in `next dev` and on Vercel; next.config.js
// outputFileTracingIncludes ensures the file is bundled into the
// /api/vouchers/claim serverless function on Vercel.
let arabicFontBytes: Uint8Array | null = null;
function loadArabicFont(): Uint8Array {
  if (!arabicFontBytes) {
    const fontPath = path.join(
      process.cwd(),
      'src/lib/fonts/NotoNaskhArabic-Regular.ttf',
    );
    arabicFontBytes = fs.readFileSync(fontPath);
  }
  return arabicFontBytes;
}

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
  pdf.registerFontkit(fontkit);
  // 612 x 792 = US Letter
  const page = pdf.addPage([612, 792]);

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);
  // Embed the Arabic font WITHOUT subsetting. pdf-lib's subsetter has a
  // known issue with the U+FDFD Bismillah ligature glyph — when subsetting
  // is on, the glyph is silently dropped from the embedded font even though
  // fontkit reports the codepoint is present. Embedding the full font costs
  // ~300KB per PDF, which is fine for an email attachment.
  const arabic = await pdf.embedFont(loadArabicFont());

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
  // Bismillah ligature ﷽ (U+FDFD) — single-codepoint Arabic ligature meaning
  // "In the name of Allah, the Most Gracious, the Most Merciful." Rendered via
  // the embedded Noto Naskh Arabic font; pdf-lib's StandardFonts can't encode
  // it because they're WinAnsi-only.
  //
  // Note: this glyph has an unusually wide advance (~12 ems in Noto Naskh
  // Arabic), so it must be drawn at a smaller size than typical headings.
  // At size=14 it occupies ~170pt wide × ~24pt tall, fitting the right side
  // of the green header band. x=412 right-aligns it with a ~30pt margin.
  page.drawText('﷽', {
    x: 412, y: 737, size: 14, font: arabic, color: rgb(1, 1, 1),
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
