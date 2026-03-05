import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, quotation: { select: { agentId: true } }, shippingMarkRef: true, createdAt: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.quotation.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { cartons, netWeight, grossWeight, dimensions, notes, markAsSent } = body;

  // Auto-generate ref on first save
  let ref = order.shippingMarkRef;
  if (!ref) {
    const year  = new Date().getFullYear();
    const count = await prisma.order.count();
    ref = `RUYA-${year}-${String(count).padStart(4, "0")}`;
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      shippingMarkRef:         ref,
      shippingMarkCartons:     cartons     ? parseInt(cartons, 10)   : undefined,
      shippingMarkNetWeight:   netWeight   ? String(netWeight)       : undefined,
      shippingMarkGrossWeight: grossWeight ? String(grossWeight)     : undefined,
      shippingMarkDimensions:  dimensions  ? String(dimensions)      : undefined,
      shippingMarkNotes:       notes       !== undefined ? String(notes || "") : undefined,
      ...(markAsSent ? { shippingMarkSentAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true, ref: updated.shippingMarkRef, sentAt: updated.shippingMarkSentAt });
}
