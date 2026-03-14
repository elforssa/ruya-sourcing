import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewRequestAvailableEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    productName,
    description,
    quantity,
    targetPrice,
    destinationCountry,
    serviceType,
    referenceImages,
    notes,
  } = body;

  if (!productName?.trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  if (!quantity || parseInt(quantity) < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }
  if (!serviceType) {
    return NextResponse.json({ error: "Service type is required" }, { status: 400 });
  }

  const request = await prisma.sourcingRequest.create({
    data: {
      productName: productName.trim(),
      description: description?.trim() || null,
      quantity: parseInt(quantity),
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      destinationCountry: destinationCountry?.trim() || null,
      serviceType,
      referenceImages:
        Array.isArray(referenceImages) && referenceImages.length > 0
          ? JSON.stringify(referenceImages)
          : null,
      notes: notes?.trim() || null,
      status: "SUBMITTED",
      clientId: session.user.id,
    },
  });

  // Notify all active agents + admins
  const clientName = session.user.name ?? "Client";
  const recipients = await prisma.user.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] }, isActive: true },
    select: { id: true, email: true, name: true },
  });

  await Promise.all(
    recipients.map(async (r) => {
      await createNotification(
        r.id,
        "New sourcing request",
        `${clientName} submitted a new request for "${productName.trim()}".`,
        "NEW_REQUEST",
        `/agent/requests/${request.id}`
      );
      await sendNewRequestAvailableEmail(
        r.email,
        r.name ?? "Team",
        productName.trim(),
        request.id,
        clientName,
        parseInt(quantity)
      );
    })
  );

  return NextResponse.json({ id: request.id }, { status: 201 });
}
