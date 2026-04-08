import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Phone, ClipboardList } from "lucide-react";

export default async function AgentRequestsPage() {
  const session = await getSession();
  if (!session) return null;

  const requests = await prisma.sourcingRequest.findMany({
    where: { assignedAgentId: session.user.id },
    include: {
      client: { select: { name: true, email: true, phoneNumber: true } },
      _count: { select: { quotations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Assigned Requests</h1>
        <p className="mt-1 text-muted-foreground">Manage sourcing requests assigned to you.</p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-0 shadow-elevation-1">
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No requests assigned yet"
              description="Pick up requests from the dashboard to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-0 border-l-[3px] border-l-transparent shadow-elevation-1 transition-all hover:border-l-accent hover:shadow-elevation-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{req.productName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Client: {req.client.name} ({req.client.email})
                    </p>
                    {req.client.phoneNumber && (
                      <a
                        href={`tel:${req.client.phoneNumber}`}
                        className="mt-0.5 flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <Phone className="h-3 w-3" />{req.client.phoneNumber}
                      </a>
                    )}
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="font-medium">{req.serviceType.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">{req.quantity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Price</p>
                    <p className="font-mono font-medium">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
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
                    className="btn-press ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90"
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
