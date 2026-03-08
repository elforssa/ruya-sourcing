import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceiptNotification } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED  = ["image/jpeg", "image/png", "application/pdf"];

async function verifyMagicBytes(file: File): Promise<boolean> {
  const buf = Buffer.from(await file.slice(0, 8).arrayBuffer());
  const jpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const png  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const pdf  = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  if (file.type === "image/jpeg")      return jpeg;
  if (file.type === "image/png")       return png;
  if (file.type === "application/pdf") return pdf;
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client:  { select: { id: true, name: true, email: true } },
      request: { select: { productName: true } },
    },
  });

  if (!order)                              return NextResponse.json({ error: "Not found" },    { status: 404 });
  if (order.clientId !== session.user.id)  return NextResponse.json({ error: "Forbidden" },   { status: 403 });
  if (order.status !== "PAYMENT_PENDING")  return NextResponse.json({ error: "Order is not awaiting payment." }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("receipt") as File | null;

  if (!file)                        return NextResponse.json({ error: "No file uploaded." },           { status: 400 });
  if (!ALLOWED.includes(file.type))  return NextResponse.json({ error: "Only JPG, PNG, or PDF files are accepted." }, { status: 400 });
  if (file.size > MAX_SIZE)          return NextResponse.json({ error: "File must be under 5 MB." },            { status: 400 });
  if (!await verifyMagicBytes(file)) return NextResponse.json({ error: "File content does not match its declared type." }, { status: 400 });

  const ext        = file.type === "application/pdf" ? ".pdf" : file.type === "image/png" ? ".png" : ".jpg";
  const filename   = `${Date.now()}-${params.id}${ext}`;
  const uploadDir  = join(process.cwd(), "public", "uploads", "receipts");
  const filePath   = join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const receiptUrl = `/uploads/receipts/${filename}`;

  await prisma.order.update({
    where: { id: params.id },
    data: {
      paymentReceiptUrl:     receiptUrl,
      paymentSubmittedAt:    new Date(),
      paymentRejectedReason: null,
    },
  });

  // Notify admin via in-app + email
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, email: true },
  });

  await Promise.all(
    admins.map(async (admin: { id: string; email: string }) => {
      await createNotification(
        admin.id,
        "Payment receipt submitted",
        `${order.client.name} submitted a receipt for "${order.request.productName}".`,
        "PAYMENT_RECEIPT",
        `/admin/orders/${params.id}`
      );
      await sendPaymentReceiptNotification(
        admin.email,
        order.client.name ?? "Client",
        order.request.productName,
        params.id
      );
    })
  );

  return NextResponse.json({ ok: true, receiptUrl });
}
