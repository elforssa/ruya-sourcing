"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, ChevronDown, UserCheck, ArrowRight } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";

type Agent = { id: string; name: string | null };
type Request = {
  id: string;
  productName: string;
  destinationCountry: string | null;
  quantity: number;
  status: string;
  createdAt: Date;
  client: { name: string | null };
  agent: { name: string | null } | null;
};

const STATUSES = ["DRAFT", "SUBMITTED", "ASSIGNED", "QUOTATION_SENT", "VALIDATED", "CONVERTED"];

export default function RequestsTable({
  requests,
  agents,
}: {
  requests: Request[];
  agents: Agent[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const filtered = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (agentFilter === "UNASSIGNED" && r.agent !== null) return false;
    if (agentFilter !== "ALL" && agentFilter !== "UNASSIGNED" && r.agent?.name !== agentFilter) return false;
    if (monthFilter === "THIS_MONTH") {
      const m = `${r.createdAt.getFullYear?.() ?? new Date(r.createdAt).getFullYear()}-${String((r.createdAt.getMonth?.() ?? new Date(r.createdAt).getMonth()) + 1).padStart(2, "0")}`;
      if (m !== thisMonth) return false;
    }
    if (monthFilter === "LAST_MONTH") {
      const d = new Date(r.createdAt);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (m !== lastMonth) return false;
    }
    return true;
  });

  const assignAgent = async (requestId: string) => {
    const agentId = selectedAgents[requestId];
    if (!agentId) { setError((e) => ({ ...e, [requestId]: "Select an agent first." })); return; }
    setAssigning(requestId);
    setError((e) => { const n = { ...e }; delete n[requestId]; return n; });
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      setError((e) => ({ ...e, [requestId]: err instanceof Error ? err.message : "Failed" }));
    } finally {
      setAssigning(null);
    }
  };

  const select = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={select}>
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Agent</span>
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={select}>
            <option value="ALL">All Agents</option>
            <option value="UNASSIGNED">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.name ?? a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Date</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={select}>
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {requests.length} requests
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Client", "Product", "Destination", "Date", "Status", "Assigned Agent"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  No requests match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{req.client.name}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{req.productName}</p>
                    <p className="text-xs text-muted-foreground">{req.quantity.toLocaleString()} units</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {req.destinationCountry ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />{req.destinationCountry}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(req.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.agent ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {req.agent.name}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={selectedAgents[req.id] ?? ""}
                            onChange={(e) => setSelectedAgents((s) => ({ ...s, [req.id]: e.target.value }))}
                            className="rounded-lg border border-input bg-background pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                          >
                            <option value="">Select agent…</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        </div>
                        <button
                          onClick={() => assignAgent(req.id)}
                          disabled={assigning === req.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-60"
                        >
                          {assigning === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                        </button>
                      </div>
                    )}
                    {error[req.id] && <p className="text-xs text-destructive mt-1">{error[req.id]}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/requests`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
