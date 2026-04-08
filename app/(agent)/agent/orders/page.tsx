import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentOrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { quotation: { agentId: session.user.id } },
    include: {
      request: { select: { productName: true } },
      client: { select: { name: true } },
      quotation: { select: { totalPrice: true, supplierLocation: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Orders</h1>
        <p className="mt-1 text-muted-foreground">Orders placed from your quotations.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow-elevation-1">
          <CardContent>
            <EmptyState icon={Package} title="No orders yet" description="Orders will appear here when clients accept your quotations." />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {orders.map((order) => (
              <Card key={order.id} className="border-0 shadow-elevation-1">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{order.request.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Client: {order.client.name}</span>
                    <span>Location: {order.quotation.supplierLocation ?? "—"}</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(order.quotation.totalPrice)}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <Link
                    href={`/agent/orders/${order.id}`}
                    className="btn-press inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90"
                  >
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden border-0 shadow-elevation-1 sm:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <tr key={order.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</td>
                        <td className="px-4 py-3 font-medium">{order.request.productName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{order.client.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{order.quotation.supplierLocation ?? "—"}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(order.quotation.totalPrice)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} size="sm" /></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/agent/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80">
                            Manage <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
