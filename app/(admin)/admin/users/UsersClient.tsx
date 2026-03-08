"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, UserX, UserCheck, Trash2, Eye, UserPlus,
  Loader2, CheckCircle2, X, ArrowLeftRight, AlertTriangle,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────────

export interface ClientUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  isActive: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  _count: { sourcingRequests: number; orders: number };
}

export interface AgentUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  isActive: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  assignedRequestsCount: number;
  completedOrdersCount: number;
  conversionRate: number;
  activeRequests:  number;
  activeOrders:    number;
  totalActive:     number;
  workloadStatus:  string;
}

// ── Modals ──────────────────────────────────────────────────────────────────────

function ChangeRoleModal({ userId, userName, currentRole, onClose, onDone }: {
  userId: string; userName: string; currentRole: string;
  onClose: () => void; onDone: (newRole: string) => void;
}) {
  const newRole = currentRole === "CLIENT" ? "AGENT" : "CLIENT";
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const roleBadgeCls = (r: string) =>
    r === "AGENT" ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-emerald-100 text-emerald-800 border-emerald-200";

  const submit = async () => {
    setLoading(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}/role`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); setLoading(false); return; }
    onDone(newRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">Change Role</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to change{" "}
          <span className="font-semibold text-foreground">{userName}</span>
          {"'s role from "}
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mx-0.5 ${roleBadgeCls(currentRole)}`}>
            {currentRole}
          </span>
          {" to "}
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mx-0.5 ${roleBadgeCls(newRole)}`}>
            {newRole}
          </span>
          {"?"}
        </p>

        <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          The user will receive an email notifying them of this change.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
            Confirm Change
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function BanModal({ userId, userName, onClose, onDone }: {
  userId: string; userName: string; onClose: () => void; onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) { setError("Please enter a reason."); return; }
    setLoading(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}/ban`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); setLoading(false); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-base">Ban User</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Banning <span className="font-semibold">{userName}</span></p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          The user will be immediately locked out of their account.
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Ban reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Violated terms of service, fraudulent activity…"
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
            Confirm Ban
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ userId, userName, onClose, onDone }: {
  userId: string; userName: string; onClose: () => void; onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); setLoading(false); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-base">Delete User</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Deleting <span className="font-semibold">{userName}</span></p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
          <p className="font-semibold">⚠ This action is permanent and cannot be undone.</p>
          <p>All of this user&apos;s requests, quotations, orders, and notifications will be permanently deleted.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Permanently
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────────

function Avatar({ name, isActive }: { name: string | null; isActive: boolean }) {
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      {getInitials(name)}
    </div>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
      <UserX className="h-3 w-3" /> Banned
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────

interface Props {
  clients: ClientUser[];
  agents: AgentUser[];
  successMessage?: string;
}

export default function UsersClient({ clients, agents, successMessage }: Props) {
  const router = useRouter();
  const [tab,              setTab]              = useState<"clients" | "agents">("clients");
  const [search,           setSearch]           = useState("");
  const [statusFilter,     setStatusFilter]     = useState<"ALL" | "ACTIVE" | "BANNED">("ALL");

  const [banTarget,        setBanTarget]        = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<{ id: string; name: string } | null>(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState<{ id: string; name: string; role: string } | null>(null);
  const [actionOk,         setActionOk]         = useState(successMessage ?? "");
  const [workloadSort,     setWorkloadSort]      = useState<"asc" | "desc" | null>(null);

  const [reactivating, setReactivating] = useState<string | null>(null);

  useEffect(() => {
    if (actionOk) {
      const t = setTimeout(() => setActionOk(""), 6000);
      return () => clearTimeout(t);
    }
  }, [actionOk]);

  const reactivate = async (id: string) => {
    setReactivating(id);
    await fetch(`/api/admin/users/${id}/reactivate`, { method: "PATCH" });
    setReactivating(null);
    setActionOk("User reactivated.");
    router.refresh();
  };

  const onBanDone = () => {
    setBanTarget(null);
    setActionOk("User banned successfully.");
    router.refresh();
  };

  const onDeleteDone = () => {
    setDeleteTarget(null);
    setActionOk("User deleted permanently.");
    router.refresh();
  };

  const onRoleChangeDone = (newRole: string) => {
    setChangeRoleTarget(null);
    setActionOk(`Role updated to ${newRole}. Notification email sent.`);
    router.refresh();
  };

  const sortedAgents = workloadSort
    ? [...agents].sort((a, b) =>
        workloadSort === "asc" ? a.totalActive - b.totalActive : b.totalActive - a.totalActive
      )
    : agents;

  const filterRows = <T extends { name: string | null; email: string; isActive: boolean }>(rows: T[]) =>
    rows
      .filter((u) =>
        !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter((u) =>
        statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? u.isActive : !u.isActive
      );

  const filteredClients = filterRows(clients);
  const filteredAgents  = filterRows(sortedAgents);
  const rows = tab === "clients" ? filteredClients : filteredAgents;

  return (
    <>
      {/* Modals */}
      {banTarget && (
        <BanModal
          userId={banTarget.id} userName={banTarget.name}
          onClose={() => setBanTarget(null)} onDone={onBanDone}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          userId={deleteTarget.id} userName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)} onDone={onDeleteDone}
        />
      )}
      {changeRoleTarget && (
        <ChangeRoleModal
          userId={changeRoleTarget.id}
          userName={changeRoleTarget.name}
          currentRole={changeRoleTarget.role}
          onClose={() => setChangeRoleTarget(null)}
          onDone={onRoleChangeDone}
        />
      )}

      {/* Success banner */}
      {actionOk && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{actionOk}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-5">
        {/* Top row: tabs + add agent */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-lg border bg-muted/20 p-0.5 gap-0.5">
            {(["clients", "agents"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all capitalize ${
                  tab === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t} <span className="ml-1 text-xs opacity-60">({t === "clients" ? clients.length : agents.length})</span>
              </button>
            ))}
          </div>
          <Link
            href="/admin/users/new-agent"
            className="sm:hidden inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Add
          </Link>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground sm:ml-auto hidden sm:inline">{rows.length} user{rows.length !== 1 ? "s" : ""}</span>

        {/* Add agent button desktop */}
        <Link
          href="/admin/users/new-agent"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Add Agent
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No users match this filter.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {tab === "clients"
              ? filteredClients.map((u) => (
                  <div key={u.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={u.name} isActive={u.isActive} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <StatusBadge isActive={u.isActive} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{u._count.sourcingRequests} requests</span>
                      <span>{u._count.orders} orders</span>
                      <span>{formatDate(u.createdAt)}</span>
                    </div>
                    <ActionButtons u={u} currentRole="CLIENT" setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} setChangeRoleTarget={setChangeRoleTarget} reactivate={reactivate} reactivating={reactivating} />
                  </div>
                ))
              : filteredAgents.map((u) => (
                  <div key={u.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={u.name} isActive={u.isActive} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <StatusBadge isActive={u.isActive} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Assigned</p>
                        <p className="font-semibold">{u.assignedRequestsCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold">{u.completedOrdersCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conv.</p>
                        <p className={`font-semibold ${u.conversionRate >= 50 ? "text-emerald-600" : u.conversionRate > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{u.conversionRate}%</p>
                      </div>
                    </div>
                    <ActionButtons u={u} currentRole="AGENT" setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} setChangeRoleTarget={setChangeRoleTarget} reactivate={reactivate} reactivating={reactivating} />
                  </div>
                ))
            }
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  {tab === "clients" ? (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requests</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Orders</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Completed</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conv. Rate</th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => setWorkloadSort((s) => s === "asc" ? "desc" : "asc")}
                      >
                        Workload {workloadSort === "asc" ? "↑" : workloadSort === "desc" ? "↓" : "↕"}
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tab === "clients"
                  ? filteredClients.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} isActive={u.isActive} />
                            <span className="font-medium">{u.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold">{u._count.sourcingRequests}</td>
                        <td className="px-4 py-3 font-semibold">{u._count.orders}</td>
                        <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                        <td className="px-4 py-3">
                          <ActionButtons u={u} currentRole="CLIENT" setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} setChangeRoleTarget={setChangeRoleTarget} reactivate={reactivate} reactivating={reactivating} />
                        </td>
                      </tr>
                    ))
                  : filteredAgents.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} isActive={u.isActive} />
                            <span className="font-medium">{u.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold">{u.assignedRequestsCount}</td>
                        <td className="px-4 py-3 font-semibold">{u.completedOrdersCount}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${u.conversionRate >= 50 ? "text-emerald-600" : u.conversionRate > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {u.conversionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                              u.workloadStatus === "HIGH"   ? "bg-red-500" :
                              u.workloadStatus === "MEDIUM" ? "bg-amber-400" :
                              "bg-emerald-500"
                            }`} />
                            <span className={`text-sm font-semibold ${
                              u.workloadStatus === "HIGH"   ? "text-red-600" :
                              u.workloadStatus === "MEDIUM" ? "text-amber-600" :
                              "text-emerald-700"
                            }`}>{u.totalActive}</span>
                            <span className="text-xs text-muted-foreground">({u.activeRequests}r·{u.activeOrders}o)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                        <td className="px-4 py-3">
                          <ActionButtons u={u} currentRole="AGENT" setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} setChangeRoleTarget={setChangeRoleTarget} reactivate={reactivate} reactivating={reactivating} />
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function ActionButtons({ u, currentRole, setBanTarget, setDeleteTarget, setChangeRoleTarget, reactivate, reactivating }: {
  u: { id: string; name: string | null; isActive: boolean };
  currentRole: string;
  setBanTarget: (v: { id: string; name: string }) => void;
  setDeleteTarget: (v: { id: string; name: string }) => void;
  setChangeRoleTarget: (v: { id: string; name: string; role: string }) => void;
  reactivate: (id: string) => void;
  reactivating: string | null;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link
        href={`/admin/users/${u.id}`}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted/20 transition-colors"
      >
        <Eye className="h-3 w-3" /> View
      </Link>
      <button
        onClick={() => setChangeRoleTarget({ id: u.id, name: u.name ?? "this user", role: currentRole })}
        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <ArrowLeftRight className="h-3 w-3" />
        {currentRole === "CLIENT" ? "→ Agent" : "→ Client"}
      </button>
      {u.isActive ? (
        <button
          onClick={() => setBanTarget({ id: u.id, name: u.name ?? "this user" })}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <UserX className="h-3 w-3" /> Ban
        </button>
      ) : (
        <button
          onClick={() => reactivate(u.id)}
          disabled={reactivating === u.id}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
        >
          {reactivating === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
          Reactivate
        </button>
      )}
      <button
        onClick={() => setDeleteTarget({ id: u.id, name: u.name ?? "this user" })}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-3 w-3" /> Delete
      </button>
    </div>
  );
}
