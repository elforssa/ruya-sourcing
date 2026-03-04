import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    include: { request: true },
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

  if (action === "ACCEPT") {
    await prisma.$transaction([
      prisma.quotation.update({
        where: { id: params.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.sourcingRequest.update({
        where: { id: quotation.requestId },
        data: { status: "VALIDATED" },
      }),
    ]);
  } else if (action === "REQUEST_REVISION") {
    await prisma.quotation.update({
      where: { id: params.id },
      data: {
        status: "REVISION_REQUESTED",
        notes: revisionNotes
          ? `[Revision requested] ${revisionNotes}`
          : quotation.notes,
      },
    });
  } else if (action === "REJECT") {
    await prisma.quotation.update({
      where: { id: params.id },
      data: { status: "REJECTED" },
    });
  }

  return NextResponse.json({ ok: true });
}
