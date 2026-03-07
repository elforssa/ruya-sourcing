import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRoleChangedEmail } from "@/lib/email";

const ALLOWED_ROLES = ["CLIENT", "AGENT"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const { role } = await req.json() as { role: unknown };

  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    return NextResponse.json(
      { error: "Role must be CLIENT or AGENT. Admin promotion requires terminal access." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot change an admin's role." }, { status: 403 });
  }
  if (target.role === role) {
    return NextResponse.json({ error: `User is already a ${role}.` }, { status: 400 });
  }

  const fromRole = target.role;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: role as AllowedRole },
  });

  // Audit log
  await prisma.roleChangeLog.create({
    data: {
      userId:      params.id,
      userEmail:   target.email,
      userName:    target.name,
      changedById: session.user.id,
      adminEmail:  session.user.email ?? "",
      fromRole,
      toRole:      role as string,
    },
  });

  // Notify user of their role change (fire-and-forget)
  sendRoleChangedEmail(
    target.email,
    target.name ?? "User",
    fromRole,
    role as string
  ).catch(() => null);

  return NextResponse.json({ ok: true, role: updated.role });
}
