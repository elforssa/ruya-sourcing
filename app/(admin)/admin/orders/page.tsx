import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">All Orders</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide order management.</p>
      </div>

      <Card className="border-0 shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-base">Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {orders.map((order) => (
              <div key={order.id} className="py-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 sm:mr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {order.request.productName} · Client: {order.client.name} · Agent: {order.quotation.agent.name}
                  </p>
                </div>
                <div className="mt-1.5 flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground sm:mt-0 sm:gap-4">
                  <span>{order.carrier ?? "No carrier"}</span>
                  <span className="hidden sm:inline">{order.trackingNumber ?? "No tracking"}</span>
                  <span>{formatDate(order.createdAt)}</span>
                  <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent/80">
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
