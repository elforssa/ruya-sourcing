import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewRequestEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await req.json();

  const agent = await prisma.user.findUnique({ where: { id: agentId, role: "AGENT" } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const request = await prisma.sourcingRequest.update({
    where: { id: params.id },
    include: { client: { select: { name: true } } },
    data: {
      assignedAgentId: agentId,
      status: "ASSIGNED",
    },
  });

  await sendNewRequestEmail(
    agent.email,
    agent.name ?? "Agent",
    request.productName,
    request.id,
    request.client.name ?? "Client"
  );

  await createNotification(
    agentId,
    "New request assigned",
    `Admin assigned you to the sourcing request for "${request.productName}". Please prepare a quotation.`,
    "NEW_REQUEST",
    `/agent/requests/${params.id}`
  );

  return NextResponse.json({ ok: true });
}
