import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdateEmail, sendOrderStatusAdminAlert } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const STATUS_ORDER = [
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
];

const ALLOWED_TRANSITIONS: Record<string, string> = {
  CONFIRMED:       "PAYMENT_PENDING",
  PAYMENT_PENDING: "PAID",
  PAID:            "IN_PRODUCTION",
  IN_PRODUCTION:   "SHIPPED",
  SHIPPED:         "DELIVERED",
};

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

  if (!STATUS_ORDER.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const currentStatus = order.status;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (status !== currentStatus && status !== allowedNext) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentStatus.replace(/_/g, " ")} to ${status.replace(/_/g, " ")}. Next allowed status: ${allowedNext?.replace(/_/g, " ") ?? "none"}.` },
      { status: 400 }
    );
  }

  if (status === "SHIPPED" && (!carrier?.trim() || !trackingNumber?.trim())) {
    return NextResponse.json(
      { error: "Carrier and tracking number are required to mark as shipped." },
      { status: 400 }
    );
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

  await createNotification(
    order.clientId,
    `Order update: ${status.replace(/_/g, " ")}`,
    `Your order for "${productName}" has been updated to ${status.replace(/_/g, " ").toLowerCase()}.`,
    "ORDER_UPDATE",
    `/client/orders/${params.id}`
  );

  return NextResponse.json({ ok: true, order: updated });
}
