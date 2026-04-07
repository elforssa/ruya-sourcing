import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendQuotationReceivedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rl = await rateLimit(`quotation:${session.user.id}`, 20, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
  } catch {
    // Rate limiter unavailable — allow through
  }

  const request = await prisma.sourcingRequest.findUnique({
    where: { id: params.id },
    include: {
      quotations: { orderBy: { version: "desc" }, take: 1 },
      client: { select: { name: true, email: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.assignedAgentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { supplierLocation, unitPrice, totalPrice, estimatedLeadTime, shippingCostEstimate, serviceFee, notes } = body;

  if (!unitPrice || isNaN(parseFloat(unitPrice))) {
    return NextResponse.json({ error: "Unit price is required" }, { status: 400 });
  }

  const parsedUnitPrice = parseFloat(unitPrice);
  const parsedTotalPrice = parseFloat(totalPrice);
  const parsedShipping = shippingCostEstimate ? parseFloat(shippingCostEstimate) : null;
  const parsedServiceFee = serviceFee ? parseFloat(serviceFee) : null;

  if (
    parsedUnitPrice < 0 || !isFinite(parsedUnitPrice) ||
    parsedTotalPrice < 0 || !isFinite(parsedTotalPrice) ||
    (parsedShipping !== null && (parsedShipping < 0 || !isFinite(parsedShipping))) ||
    (parsedServiceFee !== null && (parsedServiceFee < 0 || !isFinite(parsedServiceFee)))
  ) {
    return NextResponse.json({ error: "Prices must be non-negative finite numbers" }, { status: 400 });
  }

  const prevQuotation = request.quotations[0] ?? null;
  const prevVersion = prevQuotation?.version ?? 0;
  const isRevision = prevQuotation?.status === "REVISION_REQUESTED";

  await prisma.$transaction([
    prisma.quotation.create({
      data: {
        requestId: params.id,
        agentId: session.user.id,
        supplierLocation: supplierLocation?.trim() || null,
        unitPrice: parsedUnitPrice,
        totalPrice: parsedTotalPrice,
        estimatedLeadTime: estimatedLeadTime ? parseInt(estimatedLeadTime) : null,
        shippingCostEstimate: parsedShipping,
        serviceFee: parsedServiceFee,
        notes: notes?.trim() || null,
        status: "PENDING",
        version: prevVersion + 1,
      },
    }),
    prisma.sourcingRequest.update({
      where: { id: params.id },
      data: { status: "QUOTATION_SENT" },
    }),
  ]);

  await sendQuotationReceivedEmail(
    request.client.email,
    request.client.name ?? "Client",
    request.productName,
    params.id,
    session.user.name ?? "Your agent",
    isRevision
  );

  await createNotification(
    request.clientId,
    isRevision ? "Revised quotation received" : "New quotation received",
    isRevision
      ? `Your agent submitted a revised quotation for "${request.productName}". Review the updated pricing.`
      : `Your agent submitted a quotation for "${request.productName}". Review and respond.`,
    "QUOTATION_SENT",
    `/client/requests/${params.id}`
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
