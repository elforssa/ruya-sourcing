import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, MessageSquare, ClipboardList } from "lucide-react";

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My Requests</h1>
        <p className="mt-1 text-muted-foreground">All your sourcing requests.</p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-0 shadow-elevation-1">
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No sourcing requests yet"
              description="Submit your first request to get started."
              action={{ label: "New Request", href: "/client/new-request" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Link key={req.id} href={`/client/requests/${req.id}`} className="group block">
              <Card className="cursor-pointer border-0 border-l-[3px] border-l-transparent shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:border-l-accent hover:shadow-elevation-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base transition-colors group-hover:text-accent">{req.productName}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{req.serviceType.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} size="sm" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-medium">{req.quantity.toLocaleString()} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target Price</p>
                      <p className="font-mono font-medium">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{req.destinationCountry ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                  {req._count.quotations > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      <MessageSquare className="h-3 w-3" />
                      {req._count.quotations} quotation{req._count.quotations !== 1 ? "s" : ""} received
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
