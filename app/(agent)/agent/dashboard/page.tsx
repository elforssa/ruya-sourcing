import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ClipboardList, FileText, TrendingUp, ArrowRight, MapPin, Inbox } from "lucide-react";
import { formatDate } from "@/lib/utils";
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
      href: "/agent/requests",
    },
    {
      label: "Quotations Sent",
      value: totalQuotations,
      sub: `${assignedRequests.filter((r) => r.status === "QUOTATION_SENT").length} pending client review`,
      icon: FileText,
      href: "/agent/quotations",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      sub: `${convertedCount} of ${totalAssigned} converted`,
      icon: TrendingUp,
      href: "/agent/requests",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-sm text-muted-foreground">
          {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {greeting}, {session.user.name?.split(" ")[0] ?? "Agent"}!
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s your sourcing workload for today.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="group cursor-pointer border-0 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AvailableRequestsList initialRequests={unassignedRequests} />

      {/* My Assigned Requests */}
      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">My Assigned Requests</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Requests assigned to you, newest first
            </p>
          </div>
          <Link
            href="/agent/requests"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {assignedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No requests assigned yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick up a request from the Available Requests section above.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y sm:hidden">
                {assignedRequests.map((req) => (
                  <div key={req.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{req.productName}</p>
                        <p className="text-xs text-muted-foreground">{req.client.name} · {req.quantity.toLocaleString()} units</p>
                      </div>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {req.destinationCountry && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.destinationCountry}</span>}
                        <span>{formatDate(req.createdAt)}</span>
                      </div>
                      <Link href={`/agent/requests/${req.id}`} className="btn-press inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Destination</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignedRequests.map((req, i) => (
                      <tr key={req.id} className={`transition-colors hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                        <td className="px-6 py-4"><p className="font-medium text-foreground">{req.client.name}</p></td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">{req.productName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{req.quantity.toLocaleString()} units</p>
                        </td>
                        <td className="hidden px-4 py-4 md:table-cell">
                          {req.destinationCountry ? <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{req.destinationCountry}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{formatDate(req.createdAt)}</td>
                        <td className="px-4 py-4"><StatusBadge status={req.status} size="sm" /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/agent/requests/${req.id}`} className="btn-press inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50">
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
