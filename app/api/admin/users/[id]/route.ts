import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot delete admin accounts." }, { status: 403 });
  }

  // Cascade delete in dependency order
  await prisma.order.deleteMany({ where: { clientId: params.id } });
  await prisma.quotation.deleteMany({ where: { agentId: params.id } });
  await prisma.sourcingRequest.deleteMany({
    where: { OR: [{ clientId: params.id }, { assignedAgentId: params.id }] },
  });
  await prisma.notification.deleteMany({ where: { userId: params.id } });
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
