import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function AgentQuotationsPage() {
  const session = await getSession();
  if (!session) return null;

  const quotations = await prisma.quotation.findMany({
    where: { agentId: session.user.id },
    include: {
      request: { select: { productName: true, client: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Quotations</h1>
        <p className="text-muted-foreground mt-1">Quotations you have created for clients.</p>
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No quotations created yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotations.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{q.request.productName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Client: {q.request.client.name}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(q.status)}`}>
                    {q.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Unit Price</p>
                    <p className="font-medium">{formatCurrency(q.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Price</p>
                    <p className="font-medium">{formatCurrency(q.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Lead Time</p>
                    <p className="font-medium">{q.estimatedLeadTime ? `${q.estimatedLeadTime} days` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Shipping Est.</p>
                    <p className="font-medium">{q.shippingCostEstimate ? formatCurrency(q.shippingCostEstimate) : "—"}</p>
                  </div>
                </div>
                {q.notes && (
                  <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{q.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
