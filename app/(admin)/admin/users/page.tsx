import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { newAgent?: string; name?: string };
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;

  const [rawClients, rawAgents] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      include: { _count: { select: { sourcingRequests: true, orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "AGENT" },
      include: {
        _count: { select: { assignedRequests: true } },
        assignedRequests: {
          where:  { status: { in: ["ASSIGNED", "QUOTATION_SENT"] } },
          select: { id: true },
        },
        quotations: {
          select: {
            orders: { select: { id: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  type RawClient = (typeof rawClients)[0];
  type RawAgent  = (typeof rawAgents)[0];

  const clients = rawClients.map((u: RawClient) => ({
    id:           u.id,
    name:         u.name,
    email:        u.email,
    createdAt:    u.createdAt,
    isActive:     u.isActive,
    bannedAt:     u.bannedAt,
    bannedReason: u.bannedReason,
    _count:       u._count,
  }));

  const ACTIVE_ORDER_STATUSES = ["CONFIRMED", "PAYMENT_PENDING", "PAID", "IN_PRODUCTION", "SHIPPED"];

  const agents = rawAgents.map((u: RawAgent) => {
    const allOrders             = u.quotations.flatMap((q: RawAgent["quotations"][0]) => q.orders);
    const completedOrdersCount  = allOrders.filter((o: { status: string }) => o.status === "DELIVERED").length;
    const activeOrders          = allOrders.filter((o: { status: string }) => ACTIVE_ORDER_STATUSES.includes(o.status)).length;
    const assignedRequestsCount = u._count.assignedRequests;
    const activeRequests        = u.assignedRequests.length;
    const totalActive           = activeRequests + activeOrders;
    const workloadStatus        = totalActive <= 3 ? "LOW" : totalActive <= 6 ? "MEDIUM" : "HIGH";
    const conversionRate        = assignedRequestsCount > 0
      ? Math.round((completedOrdersCount / assignedRequestsCount) * 100)
      : 0;
    return {
      id:                   u.id,
      name:                 u.name,
      email:                u.email,
      createdAt:            u.createdAt,
      isActive:             u.isActive,
      bannedAt:             u.bannedAt,
      bannedReason:         u.bannedReason,
      assignedRequestsCount,
      completedOrdersCount,
      conversionRate,
      activeRequests,
      activeOrders,
      totalActive,
      workloadStatus,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            {clients.length} clients · {agents.length} agents
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UsersClient
            clients={clients}
            agents={agents}
            successMessage={
              searchParams.newAgent === "1"
                ? `Agent "${decodeURIComponent(searchParams.name ?? "New agent")}" created successfully. Welcome email sent.`
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
