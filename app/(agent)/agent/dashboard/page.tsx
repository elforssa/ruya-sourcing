import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, TrendingUp, ArrowRight, MapPin, Inbox } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import AvailableRequestsList from "./AvailableRequestsList";

export default async function AgentDashboard() {
  const session = await getSession();
  if (!session) return null;

  const [assignedRequests, unassignedRequests, [totalAssigned, totalQuotations, convertedCount]] = await Promise.all([
    prisma.sourcingRequest.findMany({
      where: { assignedAgentId: session.user.id },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sourcingRequest.findMany({
      where: { assignedAgentId: null, status: { in: ["SUBMITTED", "DRAFT"] } },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.sourcingRequest.count({ where: { assignedAgentId: session.user.id } }),
      prisma.quotation.count({ where: { agentId: session.user.id } }),
      prisma.sourcingRequest.count({
        where: {
          assignedAgentId: session.user.id,
          status: { in: ["VALIDATED", "CONVERTED"] },
        },
      }),
    ]),
  ]);

  const conversionRate =
    totalAssigned > 0 ? Math.round((convertedCount / totalAssigned) * 100) : 0;

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Assigned Requests",
      value: totalAssigned,
      sub: `${assignedRequests.filter((r) => r.status === "ASSIGNED").length} awaiting quotation`,
      icon: ClipboardList,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      href: "/agent/requests",
    },
    {
      label: "Quotations Sent",
      value: totalQuotations,
      sub: `${assignedRequests.filter((r) => r.status === "QUOTATION_SENT").length} pending client review`,
      icon: FileText,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      href: "/agent/quotations",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      sub: `${convertedCount} of ${totalAssigned} converted`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      href: "/agent/requests",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">
          {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {greeting}, {session.user.name?.split(" ")[0] ?? "Agent"}!
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your sourcing workload for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AvailableRequestsList initialRequests={unassignedRequests} />

      {/* My Assigned Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">My Assigned Requests</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Requests assigned to you, newest first
            </p>
          </div>
          <Link
            href="/agent/requests"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {assignedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No requests assigned yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick up a request from the Available Requests section above.
              </p>
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {assignedRequests.map((req) => (
                <div key={req.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{req.productName}</p>
                      <p className="text-xs text-muted-foreground">{req.client.name} · {req.quantity.toLocaleString()} units</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {req.destinationCountry && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.destinationCountry}</span>}
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                    <Link href={`/agent/requests/${req.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors">
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Destination</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4"><p className="font-medium text-foreground">{req.client.name}</p></td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{req.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{req.quantity.toLocaleString()} units</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {req.destinationCountry ? <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{req.destinationCountry}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>{req.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/agent/requests/${req.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors">
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
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
