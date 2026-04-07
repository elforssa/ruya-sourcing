import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { generateInvoicePDF } from "@/lib/invoice";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client:   { select: { id: true, name: true, email: true } },
      request:  { select: { productName: true, quantity: true } },
      quotation: {
        select: {
          unitPrice: true,
          totalPrice: true,
          shippingCostEstimate: true,
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!order.paymentReceiptUrl) {
    return NextResponse.json({ error: "No receipt submitted yet." }, { status: 400 });
  }

  const now       = new Date();
  const shortId   = params.id.slice(-8).toUpperCase();
  const invoiceNo = `${now.getFullYear()}-${shortId}`;
  const dateStr   = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Generate PDF invoice
  const invoiceBuffer = await generateInvoicePDF({
    invoiceNumber: invoiceNo,
    date:          dateStr,
    clientName:    order.client.name ?? "Client",
    clientEmail:   order.client.email,
    productName:   order.request.productName,
    quantity:      order.request.quantity,
    unitPrice:     order.quotation.unitPrice,
    totalPrice:    order.quotation.totalPrice,
    shippingCost:  order.quotation.shippingCostEstimate,
    orderId:       params.id,
  });

  // Save invoice to disk — sanitize ID to prevent path traversal
  const safeId = params.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const invoiceFilename = `invoice-${safeId}-${Date.now()}.pdf`;
  const invoiceDir      = join(process.cwd(), "public", "uploads", "invoices");
  await mkdir(invoiceDir, { recursive: true });
  await writeFile(join(invoiceDir, invoiceFilename), invoiceBuffer);
  const invoiceUrl = `/uploads/invoices/${invoiceFilename}`;

  // Update order
  await prisma.order.update({
    where: { id: params.id },
    data: {
      status:             "PAID",
      paymentConfirmedAt: now,
      invoiceUrl,
      paymentRejectedReason: null,
    },
  });

  // Notify client
  await createNotification(
    order.clientId,
    "Payment confirmed!",
    `Your payment for "${order.request.productName}" has been confirmed. Your invoice is ready.`,
    "PAYMENT_CONFIRMED",
    `/client/orders/${params.id}`
  );

  await sendInvoiceEmail(
    order.client.email,
    order.client.name ?? "Client",
    order.request.productName,
    params.id,
    invoiceBuffer
  );

  return NextResponse.json({ ok: true, invoiceUrl });
}
