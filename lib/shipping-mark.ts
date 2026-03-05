import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY       = rgb(0.043, 0.122, 0.231);
const GOLD       = rgb(0.788, 0.659, 0.298);
const BLACK      = rgb(0.07, 0.07, 0.09);
const GRAY       = rgb(0.45, 0.47, 0.50);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.95);
const WHITE      = rgb(1, 1, 1);
const ORANGE     = rgb(0.93, 0.46, 0.10);

export interface ShippingMarkData {
  ref: string;
  productName: string;
  quantity: number;
  destinationCountry: string | null;
  cartons: number | null;
  netWeight: string | null;
  grossWeight: string | null;
  dimensions: string | null;
  notes: string | null;
  clientName: string;
  orderId: string;
}

function drawBox(
  page: ReturnType<PDFDocument["addPage"]>,
  x: number, y: number, w: number, h: number,
  opts: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; borderWidth?: number } = {}
) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: opts.fill,
    borderColor: opts.border ?? NAVY,
    borderWidth: opts.borderWidth ?? 1,
  });
}

export async function generateShippingMarkPDF(data: ShippingMarkData): Promise<Buffer> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);

  const pad = 40;
  const innerW = width - pad * 2;

  // ── Outer border ────────────────────────────────────────────────────────────
  drawBox(page, pad - 8, 30, innerW + 16, height - 60, { border: NAVY, borderWidth: 3 });

  // ── Header band ─────────────────────────────────────────────────────────────
  const headerH = 90;
  page.drawRectangle({ x: pad - 8, y: height - headerH - 8, width: innerW + 16, height: headerH + 8, color: NAVY });

  page.drawText("RUYA", {
    x: pad, y: height - 52, font: bold, size: 32, color: GOLD,
  });
  page.drawText("GLOBAL SOURCING PLATFORM", {
    x: pad, y: height - 71, font: regular, size: 8, color: rgb(0.72, 0.62, 0.32),
  });

  // "SHIPPING MARK" on the right
  const smLabel = "SHIPPING MARK";
  const smW     = bold.widthOfTextAtSize(smLabel, 18);
  page.drawText(smLabel, {
    x: width - pad - smW, y: height - 54, font: bold, size: 18, color: WHITE,
  });
  page.drawText("DOCUMENT", {
    x: width - pad - bold.widthOfTextAtSize("DOCUMENT", 10),
    y: height - 72, font: regular, size: 10, color: rgb(0.75, 0.75, 0.75),
  });

  let y = height - headerH - 30;

  // ── Reference number box ─────────────────────────────────────────────────────
  const refBoxH = 52;
  drawBox(page, pad, y - refBoxH, innerW, refBoxH, { fill: rgb(0.97, 0.97, 1.0), border: NAVY, borderWidth: 2 });
  page.drawText("REFERENCE NO.", {
    x: pad + 12, y: y - 15, font: bold, size: 8, color: GRAY,
  });
  const refW = bold.widthOfTextAtSize(data.ref, 24);
  page.drawText(data.ref, {
    x: pad + (innerW - refW) / 2, y: y - 40, font: bold, size: 24, color: NAVY,
  });
  y -= refBoxH + 16;

  // ── Two-column info row ──────────────────────────────────────────────────────
  const colW  = (innerW - 8) / 2;
  const rowH  = 64;

  // Left: Destination
  drawBox(page, pad, y - rowH, colW, rowH, { fill: LIGHT_GRAY });
  page.drawText("DESTINATION", { x: pad + 10, y: y - 15, font: bold, size: 8, color: GRAY });
  page.drawText(data.destinationCountry ?? "—", {
    x: pad + 10, y: y - 38, font: bold, size: 16, color: BLACK,
  });
  page.drawText(`Client: ${data.clientName}`, {
    x: pad + 10, y: y - 56, font: regular, size: 8, color: GRAY,
  });

  // Right: Product
  drawBox(page, pad + colW + 8, y - rowH, colW, rowH, { fill: LIGHT_GRAY });
  page.drawText("PRODUCT", { x: pad + colW + 18, y: y - 15, font: bold, size: 8, color: GRAY });
  // Truncate long product names
  const pName = data.productName.length > 28 ? data.productName.slice(0, 28) + "…" : data.productName;
  page.drawText(pName, {
    x: pad + colW + 18, y: y - 34, font: bold, size: 13, color: BLACK,
  });
  page.drawText(`Qty: ${data.quantity.toLocaleString()} units`, {
    x: pad + colW + 18, y: y - 52, font: regular, size: 9, color: GRAY,
  });

  y -= rowH + 14;

  // ── Carton details: 4-cell grid ──────────────────────────────────────────────
  page.drawText("CARTON DETAILS", {
    x: pad, y, font: bold, size: 9, color: NAVY,
  });
  y -= 18;

  const cellW = (innerW - 6) / 4;
  const cellH = 60;
  const cells = [
    { label: "NO. OF CARTONS", value: data.cartons ? String(data.cartons) : "—", unit: "CTN" },
    { label: "NET WEIGHT",     value: data.netWeight  ?? "—", unit: "KG"  },
    { label: "GROSS WEIGHT",   value: data.grossWeight ?? "—", unit: "KG" },
    { label: "DIMENSIONS",     value: data.dimensions  ?? "—", unit: "CM" },
  ];

  cells.forEach((cell, i) => {
    const cx = pad + i * (cellW + 2);
    drawBox(page, cx, y - cellH, cellW, cellH, { border: NAVY, borderWidth: 1.5 });
    page.drawText(cell.label, {
      x: cx + 6, y: y - 14, font: bold, size: 6.5, color: GRAY,
    });
    // Value — check if it's long (dimensions)
    const valSize = cell.value.length > 10 ? 11 : 16;
    page.drawText(cell.value, {
      x: cx + 6, y: y - 36, font: bold, size: valSize, color: BLACK,
    });
    page.drawText(cell.unit, {
      x: cx + 6, y: y - 52, font: regular, size: 7, color: GRAY,
    });
  });

  y -= cellH + 16;

  // ── Order reference row ───────────────────────────────────────────────────────
  drawBox(page, pad, y - 28, innerW, 28, { fill: LIGHT_GRAY });
  page.drawText("ORDER REFERENCE:", {
    x: pad + 10, y: y - 18, font: bold, size: 8, color: GRAY,
  });
  page.drawText(`#${data.orderId.slice(-8).toUpperCase()}`, {
    x: pad + 130, y: y - 18, font: bold, size: 9, color: BLACK,
  });
  y -= 28 + 16;

  // ── Notes / factory instructions ─────────────────────────────────────────────
  if (data.notes) {
    const notesH = 70;
    drawBox(page, pad, y - notesH, innerW, notesH, { border: NAVY, borderWidth: 1 });
    page.drawText("NOTES FOR FACTORY / SUPPLIER:", {
      x: pad + 10, y: y - 14, font: bold, size: 8, color: GRAY,
    });

    // Wrap notes text (simple word-wrap)
    const words = data.notes.split(" ");
    let line = "";
    let lineY = y - 30;
    const maxLineW = innerW - 20;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(test, 9) > maxLineW && line) {
        page.drawText(line, { x: pad + 10, y: lineY, font: regular, size: 9, color: BLACK });
        line  = word;
        lineY -= 14;
        if (lineY < y - notesH + 10) break;
      } else {
        line = test;
      }
    }
    if (line) page.drawText(line, { x: pad + 10, y: lineY, font: regular, size: 9, color: BLACK });

    y -= notesH + 16;
  }

  // ── "Handle with Care" banner ─────────────────────────────────────────────────
  const isFragile = data.notes
    ? /fragile|handle.with.care|careful|delicate|breakable/i.test(data.notes)
    : false;

  if (isFragile) {
    const bannerH = 38;
    page.drawRectangle({ x: pad, y: y - bannerH, width: innerW, height: bannerH, color: rgb(1.0, 0.97, 0.93), borderColor: ORANGE, borderWidth: 2 });
    page.drawText("⚠  HANDLE WITH CARE — FRAGILE CONTENTS", {
      x: pad + 16, y: y - 24, font: bold, size: 12, color: ORANGE,
    });
    y -= bannerH + 16;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = 48;
  page.drawLine({ start: { x: pad, y: footerY + 14 }, end: { x: width - pad, y: footerY + 14 }, thickness: 0.5, color: LIGHT_GRAY });
  page.drawText("Generated by RUYA Global Sourcing Platform", {
    x: pad, y: footerY, font: regular, size: 8, color: GRAY,
  });
  page.drawText(`Ref: ${data.ref}`, {
    x: width - pad - regular.widthOfTextAtSize(`Ref: ${data.ref}`, 8),
    y: footerY, font: regular, size: 8, color: GRAY,
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
