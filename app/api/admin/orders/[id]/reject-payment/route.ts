import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPaymentRejectedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason } = await req.json();
  if (!reason?.trim()) {
    return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client:  { select: { id: true, name: true, email: true } },
      request: { select: { productName: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.order.update({
    where: { id: params.id },
    data: {
      paymentRejectedReason: reason.trim(),
      paymentReceiptUrl:     null,
      paymentSubmittedAt:    null,
    },
  });

  await createNotification(
    order.clientId,
    "Payment receipt rejected",
    `Your payment receipt for "${order.request.productName}" was rejected. Please resubmit.`,
    "PAYMENT_REJECTED",
    `/client/orders/${params.id}`
  );

  await sendPaymentRejectedEmail(
    order.client.email,
    order.client.name ?? "Client",
    order.request.productName,
    params.id,
    reason.trim()
  );

  return NextResponse.json({ ok: true });
}
