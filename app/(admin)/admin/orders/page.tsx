import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      client: { select: { name: true } },
      request: { select: { productName: true } },
      quotation: { select: { agent: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Orders</h1>
        <p className="text-muted-foreground mt-1">Platform-wide order management.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {orders.map((order) => (
              <div key={order.id} className="py-3 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 sm:mr-4">
                  <p className="text-sm font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.request.productName} · Client: {order.client.name} · Agent: {order.quotation.agent.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground shrink-0">
                  <span>{order.carrier ?? "—"}</span>
                  <span className="hidden sm:inline">{order.trackingNumber ?? "No tracking"}</span>
                  <span>{formatDate(order.createdAt)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
