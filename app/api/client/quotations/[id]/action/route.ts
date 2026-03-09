import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendQuotationAcceptedEmail, sendRevisionRequestedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      request: {
        include: { agent: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  if (quotation.request.clientId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, revisionNotes } = await req.json();

  if (!["ACCEPT", "REQUEST_REVISION", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const agentEmail = quotation.request.agent?.email;
  const agentId = quotation.request.agent?.id ?? null;
  const agentName = quotation.request.agent?.name ?? "Agent";
  const clientName = session.user.name ?? "Client";
  const productName = quotation.request.productName;
  const requestId = quotation.requestId;

  if (action === "ACCEPT") {
    const [, , newOrder] = await prisma.$transaction([
      prisma.quotation.update({
        where: { id: params.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.sourcingRequest.update({
        where: { id: quotation.requestId },
        data: { status: "VALIDATED" },
      }),
      prisma.order.create({
        data: {
          requestId: quotation.requestId,
          quotationId: params.id,
          clientId: session.user.id,
          status: "PAYMENT_PENDING",
        },
      }),
    ]);
    if (agentEmail) {
      await sendQuotationAcceptedEmail(agentEmail, agentName, clientName, productName, requestId);
    }
    if (agentId) {
      await createNotification(
        agentId,
        "Quotation accepted",
        `${clientName} accepted your quotation for "${productName}". An order has been created.`,
        "QUOTATION_ACCEPTED",
        `/agent/requests/${requestId}`
      );
    }
    return NextResponse.json({ ok: true, orderId: newOrder.id });
  } else if (action === "REQUEST_REVISION") {
    await prisma.$transaction([
      prisma.quotation.update({
        where: { id: params.id },
        data: {
          status: "REVISION_REQUESTED",
          revisionNote: revisionNotes?.trim() || null,
        },
      }),
      prisma.sourcingRequest.update({
        where: { id: quotation.requestId },
        data: { status: "ASSIGNED" },
      }),
    ]);
    if (agentEmail) {
      await sendRevisionRequestedEmail(agentEmail, agentName, clientName, productName, requestId, revisionNotes ?? "");
    }
    if (agentId) {
      await createNotification(
        agentId,
        "Revision requested",
        `${clientName} requested a revision on your quotation for "${productName}".${revisionNotes ? ` Note: ${revisionNotes.slice(0, 80)}${revisionNotes.length > 80 ? "…" : ""}` : ""}`,
        "REVISION_REQUESTED",
        `/agent/requests/${requestId}`
      );
    }
  } else if (action === "REJECT") {
    await prisma.$transaction([
      prisma.quotation.update({
        where: { id: params.id },
        data: { status: "REJECTED" },
      }),
      prisma.sourcingRequest.update({
        where: { id: quotation.requestId },
        data: { status: "SUBMITTED", assignedAgentId: null },
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
