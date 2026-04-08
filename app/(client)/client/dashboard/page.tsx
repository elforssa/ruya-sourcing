import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ClipboardList, FileText, ShoppingCart, Plus, ArrowRight, Package } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function ClientDashboard() {
  const session = await getSession();
  if (!session) return null;

  const [recentRequests, [totalRequests, pendingQuotations, activeOrders]] = await Promise.all([
    prisma.sourcingRequest.findMany({
      where: { clientId: session.user.id },
      include: { _count: { select: { quotations: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    Promise.all([
      prisma.sourcingRequest.count({ where: { clientId: session.user.id } }),
      prisma.sourcingRequest.count({
        where: { clientId: session.user.id, status: "QUOTATION_SENT" },
      }),
      prisma.order.count({
        where: { clientId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      }),
    ]),
  ]);

  const stats = [
    { label: "Total Requests", value: totalRequests, icon: ClipboardList, href: "/client/requests" },
    { label: "Pending Quotations", value: pendingQuotations, icon: FileText, href: "/client/quotations" },
    { label: "Active Orders", value: activeOrders, icon: ShoppingCart, href: "/client/orders" },
  ];

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">
            {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {greeting}, {session.user.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s an overview of your sourcing activity.
          </p>
        </div>
        <Link
          href="/client/new-request"
          className="btn-press inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Sourcing Request
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="group cursor-pointer border-0 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Requests */}
      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Recent Sourcing Requests</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">Your latest submitted requests</p>
          </div>
          <Link
            href="/client/requests"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No requests yet</p>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                Submit your first sourcing request to get started.
              </p>
              <Link
                href="/client/new-request"
                className="btn-press inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" />
                New Sourcing Request
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y sm:hidden">
                {recentRequests.map((req) => (
                  <Link key={req.id} href={`/client/requests/${req.id}`} className="block cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{req.productName}</p>
                        {req.destinationCountry && (
                          <p className="text-xs text-muted-foreground">{req.destinationCountry}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={req.status} size="sm" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{req.quantity.toLocaleString()} units</span>
                      {req.targetPrice && <span>{formatCurrency(req.targetPrice)}</span>}
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Service Type</th>
                      <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Qty</th>
                      <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Target Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRequests.map((req, i) => (
                      <tr key={req.id} className={`group cursor-pointer transition-colors hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                        <td className="px-6 py-4">
                          <Link href={`/client/requests/${req.id}`} className="block">
                            <p className="font-medium text-foreground transition-colors group-hover:text-accent">{req.productName}</p>
                            {req.destinationCountry && <p className="mt-0.5 text-xs text-muted-foreground">{req.destinationCountry}</p>}
                          </Link>
                        </td>
                        <td className="hidden px-4 py-4 md:table-cell">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{req.serviceType.replace(/_/g, " ")}</span>
                        </td>
                        <td className="hidden px-4 py-4 text-right text-muted-foreground lg:table-cell">{req.quantity.toLocaleString()}</td>
                        <td className="hidden px-4 py-4 text-right font-mono text-muted-foreground lg:table-cell">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{formatDate(req.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <StatusBadge status={req.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
