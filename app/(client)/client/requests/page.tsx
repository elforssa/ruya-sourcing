import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Requests</h1>
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
            <Link key={req.id} href={`/client/requests/${req.id}`} className="block group">
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">{req.productName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{req.serviceType.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                        {req.status.replace(/_/g, " ")}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{req.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      {req._count.quotations} quotation{req._count.quotations !== 1 ? "s" : ""} received — view now
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
