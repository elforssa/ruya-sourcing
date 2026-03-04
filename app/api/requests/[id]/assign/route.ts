import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const request = await prisma.sourcingRequest.findUnique({
    where: { id: params.id },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.assignedAgentId !== null) {
    return NextResponse.json({ error: "Already assigned to another agent" }, { status: 409 });
  }

  const updated = await prisma.sourcingRequest.update({
    where: { id: params.id },
    data: {
      assignedAgentId: session.user.id,
      status: "ASSIGNED",
    },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, request: updated });
}
