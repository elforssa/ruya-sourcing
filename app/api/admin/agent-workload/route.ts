import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_REQUEST_STATUSES = ["ASSIGNED", "QUOTATION_SENT"];
const ACTIVE_ORDER_STATUSES   = ["CONFIRMED", "PAYMENT_PENDING", "PAID", "IN_PRODUCTION", "SHIPPED"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT", isActive: true },
    select: {
      id:    true,
      name:  true,
      email: true,
      assignedRequests: {
        where:  { status: { in: ACTIVE_REQUEST_STATUSES } },
        select: { id: true },
      },
      quotations: {
        select: {
          orders: {
            where:  { status: { in: ACTIVE_ORDER_STATUSES } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = agents
    .map((agent) => {
      const activeRequests = agent.assignedRequests.length;
      const activeOrders   = agent.quotations.reduce((s, q) => s + q.orders.length, 0);
      const totalActive    = activeRequests + activeOrders;
      const workloadStatus =
        totalActive <= 3 ? "LOW" : totalActive <= 6 ? "MEDIUM" : "HIGH";

      return {
        id:             agent.id,
        name:           agent.name,
        email:          agent.email,
        activeRequests,
        activeOrders,
        totalActive,
        workloadStatus,
      };
    })
    .sort((a, b) => a.totalActive - b.totalActive);

  return NextResponse.json(result);
}
