import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground mt-1">Track all your active and past orders.</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet. Accept a quotation to create your first order.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{order.request.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Agent: {order.quotation.agent.name ?? "—"}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(order.quotation.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                    <Link href={`/client/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium">{order.request.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.quotation.agent.name ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.quotation.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/client/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
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
