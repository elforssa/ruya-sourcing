import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason } = await req.json();
  if (!reason?.trim()) {
    return NextResponse.json({ error: "Ban reason is required." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot ban admin accounts." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false, bannedAt: new Date(), bannedReason: reason.trim() },
  });

  return NextResponse.json({ ok: true });
}
