"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, DollarSign, ClipboardList,
  Users, Clock, Package, AlertCircle, Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentStat = {
  id: string;
  name: string;
  assignedRequests: number;
  completedOrders: number;
  activeOrders: number;
  avgResponseTime: number | null;
  conversionRate: number;
};

type CountryStat = { country: string; count: number; percentage: number };

type Stats = {
  requestCount: number;
  requestsChange: number | null;
  revenue: number;
  revenueChange: number | null;
  conversionRate: number;
  conversionRateTrend: number | null;
  orderCount: number;
  avgOrderValue: number;
  avgLeadTime: number | null;
  activeAgentsCount: number;
  unassigned: number;
  agentPerformance: AgentStat[];
  topCountries: CountryStat[];
};

type Range = "7d" | "30d" | "90d" | "all";

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGES: { value: Range; label: string }[] = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "all", label: "All time" },
];

const FLAG_MAP: Record<string, string> = {
  "China": "🇨🇳", "United States": "🇺🇸", "Germany": "🇩🇪",
  "India": "🇮🇳", "Japan": "🇯🇵", "South Korea": "🇰🇷",
  "Taiwan": "🇹🇼", "Vietnam": "🇻🇳", "Bangladesh": "🇧🇩",
  "Turkey": "🇹🇷", "Italy": "🇮🇹", "France": "🇫🇷",
  "United Kingdom": "🇬🇧", "Mexico": "🇲🇽", "Brazil": "🇧🇷",
  "Thailand": "🇹🇭", "Indonesia": "🇮🇩", "Malaysia": "🇲🇾",
  "Pakistan": "🇵🇰", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪",
  "Spain": "🇪🇸", "Netherlands": "🇳🇱", "Canada": "🇨🇦",
  "Australia": "🇦🇺", "Portugal": "🇵🇹", "Poland": "🇵🇱",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function getFlag(country: string) {
  return FLAG_MAP[country] ?? "🌍";
}

function getConversionColor(rate: number): { text: string; bg: string; border: string } {
  if (rate > 50) return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (rate >= 30) return { text: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  };
  return           { text: "text-red-700",     bg: "bg-red-50",    border: "border-red-200"    };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrendBadge({ change, suffix = "%" }: { change: number | null; suffix?: string }) {
  if (change === null) return <span className="text-xs text-muted-foreground">vs prev period</span>;
  const pos = change >= 0;
  const Icon = change === 0 ? Minus : pos ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${pos ? "text-emerald-600" : "text-red-500"}`}>
      <Icon className="h-3 w-3" />
      {pos ? "+" : ""}{change}{suffix} vs prev period
    </span>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor, trend, trendSuffix,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  trend?: number | null; trendSuffix?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1 leading-tight">{value}</p>
            {trend !== undefined && <div className="mt-1.5"><TrendBadge change={trend ?? null} suffix={trendSuffix ?? "%"} /></div>}
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionRateCard({ rate, trend }: { rate: number; trend: number | null }) {
  const colors = getConversionColor(rate);
  return (
    <Card className={`border ${colors.border} ${colors.bg}`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className={`text-2xl font-bold mt-1 ${colors.text}`}>{rate}%</p>
            <div className="mt-1.5"><TrendBadge change={trend} suffix=" pp" /></div>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${colors.border}`}
            style={{ background: "rgba(255,255,255,0.6)" }}>
            <TrendingUp className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${rate > 50 ? "bg-emerald-500" : rate >= 30 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {rate > 50 ? "Healthy — above target" : rate >= 30 ? "Moderate — below target" : "Low — needs attention"}
        </p>
      </CardContent>
    </Card>
  );
}

function AgentTable({ agents }: { agents: AgentStat[] }) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No agents found for this period.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left font-medium text-muted-foreground">Agent</th>
            <th className="pb-3 text-right font-medium text-muted-foreground">Assigned</th>
            <th className="pb-3 text-right font-medium text-muted-foreground">Delivered</th>
            <th className="pb-3 text-right font-medium text-muted-foreground">Active</th>
            <th className="pb-3 text-right font-medium text-muted-foreground">Avg Response</th>
            <th className="pb-3 text-right font-medium text-muted-foreground">Conversion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {agents.map((a, i) => {
            const conv = getConversionColor(a.conversionRate);
            return (
              <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">{getInitials(a.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      {i === 0 && agents.length > 1 && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Top performer</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right font-medium">{a.assignedRequests}</td>
                <td className="py-3 text-right">
                  <span className="font-medium text-emerald-700">{a.completedOrders}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-medium text-blue-600">{a.activeOrders}</span>
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {a.avgResponseTime !== null ? `${a.avgResponseTime}h` : <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="py-3 text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${conv.bg} ${conv.text} ${conv.border}`}>
                    {a.conversionRate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CountriesSection({ countries }: { countries: CountryStat[] }) {
  if (countries.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No destination data yet.</p>
      </div>
    );
  }
  const max = countries[0]?.count ?? 1;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Ranked list */}
      <div className="space-y-3">
        {countries.map((c, i) => (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <span className="text-lg shrink-0">{getFlag(c.country)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{c.country}</span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">{c.count} req · {c.percentage}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(c.count / max) * 100}%`, background: "#C9A84C" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts bar chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countries} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={28}>
            <XAxis
              dataKey="country"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: string) => v.length > 7 ? v.slice(0, 7) + "…" : v}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              formatter={(value) => [value, "Requests"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {countries.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#C9A84C" : `rgba(201,168,76,${0.75 - i * 0.12})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsSection() {
  const [range, setRange] = useState<Range>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* ── Date range filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium mr-1">Period:</span>
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              range === r.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ── Row 1: 4 main KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Requests"
              value={stats?.requestCount ?? 0}
              icon={ClipboardList}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              trend={stats?.requestsChange ?? null}
              sub={`${stats?.unassigned ?? 0} unassigned`}
            />
            <KpiCard
              label="Revenue"
              value={fmt(stats?.revenue ?? 0)}
              icon={DollarSign}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              trend={stats?.revenueChange ?? null}
              sub={`${stats?.orderCount ?? 0} orders`}
            />
            <ConversionRateCard
              rate={stats?.conversionRate ?? 0}
              trend={stats?.conversionRateTrend ?? null}
            />
            <KpiCard
              label="Avg Order Value"
              value={fmt(stats?.avgOrderValue ?? 0)}
              icon={Package}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              sub="per order"
            />
          </>
        )}
      </div>

      {/* ── Row 2: 3 secondary KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Active Agents"
              value={stats?.activeAgentsCount ?? 0}
              icon={Users}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              sub="registered on platform"
            />
            <KpiCard
              label="Avg Lead Time"
              value={stats?.avgLeadTime !== null && stats?.avgLeadTime !== undefined ? `${stats.avgLeadTime} days` : "—"}
              icon={Timer}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
              sub="across delivered orders"
            />
            <KpiCard
              label="Unassigned Requests"
              value={stats?.unassigned ?? 0}
              icon={AlertCircle}
              iconBg={stats?.unassigned ? "bg-red-50" : "bg-muted"}
              iconColor={stats?.unassigned ? "text-red-600" : "text-muted-foreground"}
              sub="awaiting agent assignment"
            />
          </>
        )}
      </div>

      {/* ── Agent performance table ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Agent Performance
            </CardTitle>
            <span className="text-xs text-muted-foreground">(sorted by conversion rate)</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <AgentTable agents={stats?.agentPerformance ?? []} />
          )}
        </CardContent>
      </Card>

      {/* ── Top destination countries ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Top Destination Countries
            {stats && stats.topCountries.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">top 5</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] bg-muted rounded animate-pulse" />
          ) : (
            <CountriesSection countries={stats?.topCountries ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
