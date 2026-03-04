import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, TrendingUp, CalendarDays } from "lucide-react";
import RequestsTable from "./RequestsTable";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRequests,
    requestsThisMonth,
    convertedCount,
    agents,
    allRequests,
    allUsers,
    allOrders,
  ] = await Promise.all([
    prisma.sourcingRequest.count(),
    prisma.sourcingRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.sourcingRequest.count({ where: { status: { in: ["VALIDATED", "CONVERTED"] } } }),
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

  const activeAgents = agents.length;
  const conversionRate = totalRequests > 0
    ? Math.round((convertedCount / totalRequests) * 100)
    : 0;

  const kpis = [
    {
      label: "Total Requests",
      value: totalRequests,
      sub: `${allRequests.filter((r) => r.status === "SUBMITTED").length} awaiting assignment`,
      icon: ClipboardList,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Agents",
      value: activeAgents,
      sub: `${allRequests.filter((r) => !r.agent).length} unassigned requests`,
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      sub: `${convertedCount} of ${totalRequests} converted`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Requests This Month",
      value: requestsThisMonth,
      sub: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      icon: CalendarDays,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview, request management, and user control.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
