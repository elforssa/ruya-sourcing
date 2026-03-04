import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function AdminRequestsPage() {
  const requests = await prisma.sourcingRequest.findMany({
    include: {
      client: { select: { name: true } },
      agent: { select: { name: true } },
      _count: { select: { quotations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Requests</h1>
        <p className="text-muted-foreground mt-1">Platform-wide sourcing requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sourcing Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium truncate">{req.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.client.name} → {req.agent?.name ?? "Unassigned"} · {req.serviceType.replace(/_/g, " ")} · {req._count.quotations} quotes
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span>{formatCurrency(req.targetPrice ?? 0)} target</span>
                  <span>{req.quantity.toLocaleString()} units</span>
                  <span>{formatDate(req.createdAt)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                    {req.status.replace(/_/g, " ")}
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
