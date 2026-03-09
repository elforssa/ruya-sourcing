import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, ShoppingCart, Plus, ArrowRight, Package } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
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
    {
      label: "Total Requests",
      value: totalRequests,
      icon: ClipboardList,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      href: "/client/requests",
    },
    {
      label: "Pending Quotations",
      value: pendingQuotations,
      icon: FileText,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      href: "/client/quotations",
    },
    {
      label: "Active Orders",
      value: activeOrders,
      icon: ShoppingCart,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      href: "/client/orders",
    },
  ];

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {greeting}, {session.user.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your sourcing activity.
          </p>
        </div>
        <Link
          href="/client/new-request"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 w-full sm:w-auto"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          <Plus className="h-4 w-4" />
          New Sourcing Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Recent Sourcing Requests</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Your latest submitted requests</p>
          </div>
          <Link
            href="/client/requests"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No requests yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                Submit your first sourcing request to get started.
              </p>
              <Link
                href="/client/new-request"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New Sourcing Request
              </Link>
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {recentRequests.map((req) => (
                <Link key={req.id} href={`/client/requests/${req.id}`} className="block px-4 py-3 space-y-2 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{req.productName}</p>
                      {req.destinationCountry && (
                        <p className="text-xs text-muted-foreground">{req.destinationCountry}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {req.status.replace(/_/g, " ")}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{req.quantity.toLocaleString()} units</span>
                    {req.targetPrice && <span>{formatCurrency(req.targetPrice)}</span>}
                    <span>{formatDate(req.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Service Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Target Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <Link href={`/client/requests/${req.id}`} className="block">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{req.productName}</p>
                          {req.destinationCountry && <p className="text-xs text-muted-foreground mt-0.5">{req.destinationCountry}</p>}
                        </Link>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{req.serviceType.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">{req.quantity.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">{req.targetPrice ? formatCurrency(req.targetPrice) : "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(req.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>{req.status.replace(/_/g, " ")}</span>
                          <Link href={`/client/requests/${req.id}`}>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Link>
                        </div>
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
