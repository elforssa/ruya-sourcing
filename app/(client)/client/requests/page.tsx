import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function ClientRequestsPage() {
  const session = await getSession();
  if (!session) return null;

  const requests = await prisma.sourcingRequest.findMany({
    where: { clientId: session.user.id },
    include: {
      agent: { select: { name: true } },
      quotations: true,
      _count: { select: { quotations: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">All your sourcing requests.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No sourcing requests yet. Contact your agent to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{req.productName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{req.serviceType.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                    {req.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{req.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="font-medium">{req.quantity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Target Price</p>
                    <p className="font-medium">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Destination</p>
                    <p className="font-medium">{req.destinationCountry ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="font-medium">{formatDate(req.createdAt)}</p>
                  </div>
                </div>
                {req._count.quotations > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    {req._count.quotations} quotation{req._count.quotations !== 1 ? "s" : ""} received
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
