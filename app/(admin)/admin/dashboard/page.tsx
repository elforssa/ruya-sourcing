import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequestsTable from "./RequestsTable";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";
import { AnalyticsSection } from "./AnalyticsSection";
import AgentWorkloadSection from "./AgentWorkloadSection";

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
            agent: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform overview, analytics, and management tools.</p>
      </div>

      <AnalyticsSection />

      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agent Workload</CardTitle>
          <p className="text-sm text-muted-foreground">Live workload across all active agents.</p>
        </CardHeader>
        <CardContent>
          <AgentWorkloadSection />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sourcing Requests</CardTitle>
          <p className="text-sm text-muted-foreground">Filter by status, agent, or date — assign agents inline.</p>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={allRequests} agents={agents} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Management</CardTitle>
          <p className="text-sm text-muted-foreground">All clients and agents — activate or deactivate accounts.</p>
        </CardHeader>
        <CardContent>
          <UsersTable users={allUsers} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Orders</CardTitle>
              <p className="text-sm text-muted-foreground">All orders across clients and agents.</p>
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
