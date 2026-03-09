import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY       = rgb(0.043, 0.122, 0.231);
const GOLD       = rgb(0.788, 0.659, 0.298);
const GREEN      = rgb(0.086, 0.631, 0.247);
const GRAY       = rgb(0.42, 0.45, 0.50);
const BLACK      = rgb(0.07, 0.07, 0.09);
const LIGHT_GRAY = rgb(0.94, 0.94, 0.96);
const WHITE      = rgb(1, 1, 1);

function amt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shippingCost?: number | null;
  orderId: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // ── Header background ──────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: NAVY });

  page.drawText("RUYA", { x: 40, y: height - 48, font: bold, size: 28, color: GOLD });
  page.drawText("GLOBAL SOURCING PLATFORM", {
    x: 40, y: height - 65, font: regular, size: 8, color: rgb(0.72, 0.62, 0.32),
  });

  page.drawText("INVOICE", { x: width - 120, y: height - 48, font: bold, size: 20, color: WHITE });
  page.drawText(`#${data.invoiceNumber}`, {
    x: width - 120, y: height - 66, font: regular, size: 9, color: rgb(0.75, 0.75, 0.75),
  });

  // ── Meta row ───────────────────────────────────────────────────────────────
  let y = height - 128;
  const meta = [
    ["Invoice Date:", data.date],
    ["Order ID:",     `#${data.orderId.slice(-8).toUpperCase()}`],
    ["Invoice No:",   `#${data.invoiceNumber}`],
  ];
  meta.forEach(([label, value], i) => {
    const x = 40 + i * 180;
    page.drawText(label, { x, y,       font: bold,    size: 8, color: GRAY  });
    page.drawText(value, { x, y: y - 14, font: regular, size: 9, color: BLACK });
  });

  // ── Divider ────────────────────────────────────────────────────────────────
  y -= 36;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: LIGHT_GRAY });

  // ── Bill To ────────────────────────────────────────────────────────────────
  y -= 20;
  page.drawText("BILL TO", { x: 40, y, font: bold, size: 8, color: GOLD });
  y -= 16;
  page.drawText(data.clientName,  { x: 40, y,      font: bold,    size: 11, color: BLACK });
  y -= 14;
  page.drawText(data.clientEmail, { x: 40, y,      font: regular, size: 9,  color: GRAY  });

  // ── Items table header ─────────────────────────────────────────────────────
  y -= 30;
  page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 22, color: NAVY });

  const TH = [
    ["DESCRIPTION", 48],
    ["QTY",          310],
    ["UNIT PRICE",   370],
    ["AMOUNT",       490],
  ] as [string, number][];
  TH.forEach(([t, x]) =>
    page.drawText(t, { x, y: y + 3, font: bold, size: 8, color: WHITE })
  );

  // ── Product row ────────────────────────────────────────────────────────────
  y -= 28;
  page.drawText(data.productName,                         { x: 48,  y, font: regular, size: 9, color: BLACK });
  page.drawText(data.quantity.toLocaleString(),           { x: 310, y, font: regular, size: 9, color: BLACK });
  page.drawText(amt(data.unitPrice),                      { x: 370, y, font: regular, size: 9, color: BLACK });
  page.drawText(amt(data.unitPrice * data.quantity),      { x: 490, y, font: regular, size: 9, color: BLACK });

  // ── Shipping row (optional) ────────────────────────────────────────────────
  if (data.shippingCost && data.shippingCost > 0) {
    y -= 22;
    page.drawLine({ start: { x: 40, y: y + 14 }, end: { x: width - 40, y: y + 14 }, thickness: 0.3, color: LIGHT_GRAY });
    page.drawText("Shipping & Logistics",      { x: 48,  y, font: regular, size: 9, color: BLACK });
    page.drawText("1",                         { x: 310, y, font: regular, size: 9, color: BLACK });
    page.drawText(amt(data.shippingCost),      { x: 370, y, font: regular, size: 9, color: BLACK });
    page.drawText(amt(data.shippingCost),      { x: 490, y, font: regular, size: 9, color: BLACK });
  }

  // ── Subtotal / Total ───────────────────────────────────────────────────────
  y -= 30;
  page.drawLine({ start: { x: 300, y }, end: { x: width - 40, y }, thickness: 1, color: NAVY });
  y -= 18;
  page.drawText("TOTAL",     { x: 300, y, font: bold,    size: 10, color: NAVY  });
  page.drawText(amt(data.totalPrice), { x: 460, y, font: bold, size: 14, color: NAVY });

  // ── Payment confirmed stamp ────────────────────────────────────────────────
  y -= 52;
  page.drawRectangle({ x: 40, y: y - 8, width: 190, height: 48, borderColor: GREEN, borderWidth: 2, color: rgb(0.94, 1, 0.96) });
  page.drawText("✓  PAYMENT CONFIRMED", { x: 52, y: y + 20, font: bold,    size: 11, color: GREEN });
  page.drawText(data.date,              { x: 52, y: y + 4,  font: regular, size: 8,  color: GREEN });

  // ── Footer ─────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 55 }, end: { x: width - 40, y: 55 }, thickness: 0.5, color: LIGHT_GRAY });
  page.drawText("Thank you for your business — RUYA Global Sourcing Platform", {
    x: 40, y: 40, font: oblique, size: 9, color: GRAY,
  });
  page.drawText("This is a computer-generated invoice. No signature required.", {
    x: 40, y: 26, font: regular, size: 7.5, color: rgb(0.7, 0.7, 0.7),
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
