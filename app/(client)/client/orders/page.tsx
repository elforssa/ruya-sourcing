import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function ClientOrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { clientId: session.user.id },
    include: {
      request: { select: { productName: true } },
      quotation: { select: { agent: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground mt-1">Track all your orders.</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{order.request.productName}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Agent</p>
                    <p className="font-medium">{order.quotation.agent.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Carrier</p>
                    <p className="font-medium">{order.carrier ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Order Date</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Tracking: </span>
                    <span className="font-mono font-medium">{order.trackingNumber}</span>
                  </div>
                )}
                {order.shippingMark && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Shipping Mark: </span>
                    <span className="font-mono font-medium">{order.shippingMark}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
