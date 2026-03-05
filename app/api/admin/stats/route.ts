import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRangeBounds(range: string): { start: Date | null; prevStart: Date | null } {
  const now = new Date();
  const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const d = days[range];
  if (!d) return { start: null, prevStart: null };
  const ms = d * 24 * 60 * 60 * 1000;
  return {
    start: new Date(now.getTime() - ms),
    prevStart: new Date(now.getTime() - 2 * ms),
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") ?? "30d";
  const { start: rangeStart, prevStart } = getRangeBounds(range);
  const dateFilter = rangeStart ? { createdAt: { gte: rangeStart } } : {};

  const [requests, orders, deliveredOrders, agents, allQuotations] = await Promise.all([
    prisma.sourcingRequest.findMany({
      where: dateFilter,
      select: { id: true, status: true, assignedAgentId: true, destinationCountry: true },
    }),
    prisma.order.findMany({
      where: dateFilter,
      select: {
        id: true,
        status: true,
        quotation: { select: { agentId: true, totalPrice: true, estimatedLeadTime: true } },
      },
    }),
    prisma.order.findMany({
      where: { status: "DELIVERED" },
      select: { quotation: { select: { estimatedLeadTime: true } } },
    }),
    prisma.user.findMany({
      where: { role: "AGENT", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.quotation.findMany({
      select: {
        agentId: true,
        createdAt: true,
        request: { select: { createdAt: true } },
      },
    }),
  ]);

  let prevRequestCount = 0;
  let prevRevenue = 0;
  let prevOrderCount = 0;

  if (rangeStart && prevStart) {
    const prevFilter = { createdAt: { gte: prevStart, lt: rangeStart } };
    const [prevReqs, prevOrds] = await Promise.all([
      prisma.sourcingRequest.count({ where: prevFilter }),
      prisma.order.findMany({
        where: prevFilter,
        select: { quotation: { select: { totalPrice: true } } },
      }),
    ]);
    prevRequestCount = prevReqs;
    prevOrderCount = prevOrds.length;
    prevRevenue = prevOrds.reduce((s, o) => s + (o.quotation?.totalPrice ?? 0), 0);
  }

  const requestCount = requests.length;
  const orderCount = orders.length;
  const revenue = orders.reduce((s, o) => s + (o.quotation?.totalPrice ?? 0), 0);

  const requestsChange =
    prevRequestCount > 0
      ? Math.round(((requestCount - prevRequestCount) / prevRequestCount) * 1000) / 10
      : null;
  const revenueChange =
    prevRevenue > 0
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10
      : null;

  const conversionRate = requestCount > 0 ? (orderCount / requestCount) * 100 : 0;
  const prevConversionRate =
    prevRequestCount > 0 ? (prevOrderCount / prevRequestCount) * 100 : null;
  const conversionRateTrend =
    prevConversionRate !== null
      ? Math.round((conversionRate - prevConversionRate) * 10) / 10
      : null;

  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  const leadTimes = deliveredOrders
    .map((o) => o.quotation?.estimatedLeadTime)
    .filter((lt): lt is number => lt != null);
  const avgLeadTime =
    leadTimes.length > 0
      ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 10) / 10
      : null;

  const quotsByAgent: Record<string, { created: Date; reqCreated: Date }[]> = {};
  for (const q of allQuotations) {
    if (!q.agentId) continue;
    if (!quotsByAgent[q.agentId]) quotsByAgent[q.agentId] = [];
    quotsByAgent[q.agentId].push({ created: q.createdAt, reqCreated: q.request.createdAt });
  }

  const agentPerformance = agents
    .map((agent) => {
      const agentReqs = requests.filter((r) => r.assignedAgentId === agent.id);
      const agentOrds = orders.filter((o) => o.quotation?.agentId === agent.id);
      const completedOrders = agentOrds.filter((o) => o.status === "DELIVERED").length;
      const activeOrders = agentOrds.filter((o) => o.status !== "DELIVERED").length;

      const responseTimes = (quotsByAgent[agent.id] ?? [])
        .map((q) => (new Date(q.created).getTime() - new Date(q.reqCreated).getTime()) / 3_600_000)
        .filter((h) => h >= 0 && h < 8760);

      const avgResponseTime =
        responseTimes.length > 0
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
          : null;

      return {
        id: agent.id,
        name: agent.name ?? "Unknown",
        assignedRequests: agentReqs.length,
        completedOrders,
        activeOrders,
        avgResponseTime,
        conversionRate:
          agentReqs.length > 0
            ? Math.round((completedOrders / agentReqs.length) * 1000) / 10
            : 0,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);

  const countryCounts: Record<string, number> = {};
  for (const r of requests) {
    const c = r.destinationCountry?.trim();
    if (c) countryCounts[c] = (countryCounts[c] ?? 0) + 1;
  }
  const totalWithCountry = Object.values(countryCounts).reduce((a, b) => a + b, 0);
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      count,
      percentage: totalWithCountry > 0 ? Math.round((count / totalWithCountry) * 100) : 0,
    }));

  const unassigned = requests.filter((r) => r.status === "SUBMITTED" && !r.assignedAgentId).length;

  return NextResponse.json({
    requestCount,
    requestsChange,
    revenue: Math.round(revenue * 100) / 100,
    revenueChange,
    conversionRate: Math.round(conversionRate * 10) / 10,
    conversionRateTrend,
    orderCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    avgLeadTime,
    activeAgentsCount: agents.length,
    unassigned,
    agentPerformance,
    topCountries,
  });
}
