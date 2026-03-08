import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AgentRequestsPage() {
  const session = await getSession();
  if (!session) return null;

  const requests = await prisma.sourcingRequest.findMany({
    where: { assignedAgentId: session.user.id },
    include: {
      client: { select: { name: true, email: true } },
      _count: { select: { quotations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assigned Requests</h1>
        <p className="text-muted-foreground mt-1">Manage sourcing requests assigned to you.</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No requests assigned yet.
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Client: {req.client.name} ({req.client.email})
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                    {req.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{req.description}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Service</p>
                    <p className="font-medium">{req.serviceType.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="font-medium">{req.quantity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Target Price</p>
                    <p className="font-medium">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Submitted</p>
                    <p className="font-medium">{formatDate(req.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {req._count.quotations > 0 && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      {req._count.quotations} quotation{req._count.quotations !== 1 ? "s" : ""} sent
                    </div>
                  )}
                  <Link
                    href={`/agent/requests/${req.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    View &amp; Quote <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
