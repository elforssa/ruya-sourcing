import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewRequestEmail } from "@/lib/email";
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
    const rl = await rateLimit(`pickup:${session.user.id}`, 15, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
  } catch {
    // Rate limiter unavailable — allow through
  }

  // Atomic check-and-update to prevent race condition where two agents
  // simultaneously pick up the same request
  try {
    var updated = await prisma.$transaction(async (tx) => {
      const request = await tx.sourcingRequest.findUnique({
        where: { id: params.id },
      });

      if (!request) {
        throw new Error("NOT_FOUND");
      }

      if (request.assignedAgentId !== null) {
        throw new Error("ALREADY_ASSIGNED");
      }

      return tx.sourcingRequest.update({
        where: { id: params.id },
        include: { client: { select: { name: true } } },
        data: {
          assignedAgentId: session.user.id,
          status: "ASSIGNED",
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "ALREADY_ASSIGNED") {
      return NextResponse.json({ error: "Request already assigned" }, { status: 409 });
    }
    throw err;
  }

  await sendNewRequestEmail(
    session.user.email!,
    session.user.name ?? "Agent",
    updated.productName,
    updated.id,
    updated.client.name ?? "Client"
  );

  await createNotification(
    session.user.id,
    "New request assigned",
    `You picked up the request for "${updated.productName}". Start preparing your quotation.`,
    "NEW_REQUEST",
    `/agent/requests/${params.id}`
  );

  return NextResponse.json({ ok: true });
}
