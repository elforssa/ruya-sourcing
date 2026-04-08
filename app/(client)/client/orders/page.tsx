import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientOrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { clientId: session.user.id },
    include: {
      request: { select: { productName: true, quantity: true } },
      quotation: {
        select: {
          totalPrice: true,
          agent: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-muted-foreground">Track all your active and past orders.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow-elevation-1">
          <CardContent>
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Accept a quotation to create your first order."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-elevation-1">
          <CardContent className="p-0">
            {/* Mobile cards */}
            <div className="divide-y sm:hidden">
              {orders.map((order) => (
                <div key={order.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{order.request.productName}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Agent: {order.quotation.agent.name ?? "—"}</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(order.quotation.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                    <Link href={`/client/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80">
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent</th>
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
                      <td className="px-4 py-3 text-muted-foreground">{order.quotation.agent.name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(order.quotation.totalPrice)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} size="sm" /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/client/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80">
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
