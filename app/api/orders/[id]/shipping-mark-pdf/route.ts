import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShippingMarkPDF } from "@/lib/shipping-mark";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      request:  { select: { productName: true, quantity: true, destinationCountry: true } },
      client:   { select: { id: true, name: true } },
      quotation: { select: { agentId: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the agent of the order, the client of the order, or an admin may access this
  const isAgent  = order.quotation.agentId === session.user.id;
  const isClient = order.clientId === session.user.id;
  const isAdmin  = session.user.role === "ADMIN";
  if (!isAgent && !isClient && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!order.shippingMarkRef) {
    return NextResponse.json({ error: "No shipping mark saved yet." }, { status: 400 });
  }

  const pdfBuffer = await generateShippingMarkPDF({
    ref:                order.shippingMarkRef,
    productName:        order.request.productName,
    quantity:           order.request.quantity,
    destinationCountry: order.request.destinationCountry,
    cartons:            order.shippingMarkCartons,
    netWeight:          order.shippingMarkNetWeight,
    grossWeight:        order.shippingMarkGrossWeight,
    dimensions:         order.shippingMarkDimensions,
    notes:              order.shippingMarkNotes,
    clientName:         order.client.name ?? "Client",
    orderId:            params.id,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="ShippingMark-${order.shippingMarkRef}.pdf"`,
      "Content-Length":      String(pdfBuffer.length),
    },
  });
}
