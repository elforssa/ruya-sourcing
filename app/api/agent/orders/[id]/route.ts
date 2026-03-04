import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdateEmail, sendOrderStatusAdminAlert } from "@/lib/email";

const VALID_STATUSES = [
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
];

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      quotation: { select: { agentId: true, agent: { select: { name: true } } } },
      client:   { select: { email: true, name: true } },
      request:  { select: { productName: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.quotation.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status, carrier, trackingNumber, estimatedDelivery, shippingMark } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      carrier: carrier?.trim() || null,
      trackingNumber: trackingNumber?.trim() || null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      shippingMark: shippingMark?.trim() || null,
    },
  });

  const clientEmail   = order.client.email;
  const clientName    = order.client.name ?? "Client";
  const productName   = order.request.productName;
  const agentName     = order.quotation.agent?.name ?? "Agent";

  await sendOrderStatusUpdateEmail(
    clientEmail,
    clientName,
    productName,
    status,
    params.id,
    trackingNumber ?? null
  );

  await sendOrderStatusAdminAlert(
    productName,
    status,
    params.id,
    clientName,
    agentName
  );

  return NextResponse.json({ ok: true, order: updated });
}
