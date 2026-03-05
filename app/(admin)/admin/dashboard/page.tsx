import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequestsTable from "./RequestsTable";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";
import { AnalyticsSection } from "./AnalyticsSection";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const [agents, allRequests, allUsers, allOrders] = await Promise.all([
    prisma.user.findMany({
      where: { role: "AGENT", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.sourcingRequest.findMany({
      include: {
        client: { select: { name: true } },
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["CLIENT", "AGENT"] } },
      include: { _count: { select: { sourcingRequests: true, quotations: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      include: {
        request: { select: { productName: true } },
        client: { select: { name: true } },
        quotation: {
          select: {
            totalPrice: true,
            supplierName: true,
            agent: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview, analytics, and management tools.</p>
      </div>

      {/* Dynamic KPI analytics — date-range aware, client-side */}
      <AnalyticsSection />

      {/* Requests Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sourcing Requests</CardTitle>
          <p className="text-sm text-muted-foreground">Filter by status, agent, or date — assign agents to unassigned requests inline.</p>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={allRequests} agents={agents} />
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Management</CardTitle>
          <p className="text-sm text-muted-foreground">All clients and agents — activate or deactivate accounts.</p>
        </CardHeader>
        <CardContent>
          <UsersTable users={allUsers} />
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Orders</CardTitle>
              <p className="text-sm text-muted-foreground">All orders across all clients and agents — filter by status.</p>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">{allOrders.length} total</span>
          </div>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={allOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
