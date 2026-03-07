"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, TrendingUp } from "lucide-react";
import { getInitials } from "@/lib/utils";

type AgentWorkload = {
  id:             string;
  name:           string | null;
  email:          string;
  activeRequests: number;
  activeOrders:   number;
  totalActive:    number;
  workloadStatus: "LOW" | "MEDIUM" | "HIGH";
};

function WorkloadBar({ total }: { total: number }) {
  const pct = Math.min(Math.round((total / 10) * 100), 100);
  const barCls =
    total >= 7 ? "bg-red-500" :
    total >= 4 ? "bg-amber-400" :
    "bg-emerald-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barCls}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "LOW" | "MEDIUM" | "HIGH" }) {
  const cfg = {
    LOW:    { label: "Available",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    MEDIUM: { label: "Busy",        cls: "bg-amber-50 text-amber-700 border-amber-200" },
    HIGH:   { label: "Overloaded",  cls: "bg-red-50 text-red-700 border-red-200" },
  }[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function AgentAvatar({ name }: { name: string | null }) {
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary">{getInitials(name ?? "?")}</span>
    </div>
  );
}

export default function AgentWorkloadSection() {
  const [workloads, setWorkloads] = useState<AgentWorkload[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/admin/agent-workload")
      .then((r) => r.json())
      .then((data) => { setWorkloads(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workloads.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No active agents found.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {workloads.map((agent) => (
        <div
          key={agent.id}
          className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <AgentAvatar name={agent.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{agent.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
              </div>
            </div>
            <StatusBadge status={agent.workloadStatus} />
          </div>

          {/* Counts */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-muted/40 px-2.5 py-1.5 text-center">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Requests</p>
              <p className={`text-base font-bold leading-none ${
                agent.activeRequests >= 4 ? "text-amber-600" : "text-foreground"
              }`}>{agent.activeRequests}</p>
            </div>
            <div className="flex-1 rounded-lg bg-muted/40 px-2.5 py-1.5 text-center">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Orders</p>
              <p className={`text-base font-bold leading-none ${
                agent.activeOrders >= 3 ? "text-amber-600" : "text-foreground"
              }`}>{agent.activeOrders}</p>
            </div>
            <div className="flex-1 rounded-lg bg-muted/40 px-2.5 py-1.5 text-center">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Total</p>
              <p className={`text-base font-bold leading-none ${
                agent.totalActive >= 7 ? "text-red-600" :
                agent.totalActive >= 4 ? "text-amber-600" :
                "text-foreground"
              }`}>{agent.totalActive}</p>
            </div>
          </div>

          {/* Workload bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Workload</span>
              <span>{agent.totalActive}/10</span>
            </div>
            <WorkloadBar total={agent.totalActive} />
          </div>

          {/* Footer */}
          <Link
            href={`/admin/users/${agent.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border py-1.5 text-xs font-medium hover:bg-muted/20 transition-colors"
          >
            <TrendingUp className="h-3 w-3" /> View Agent
          </Link>
        </div>
      ))}
    </div>
  );
}
