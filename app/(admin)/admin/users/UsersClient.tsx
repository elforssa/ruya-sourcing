"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, UserX, UserCheck, Trash2, Eye, UserPlus,
  Loader2, AlertCircle, CheckCircle2, X,
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
}

// ── Modals ──────────────────────────────────────────────────────────────────────

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
}

export default function UsersClient({ clients, agents }: Props) {
  const router = useRouter();
  const [tab,          setTab]          = useState<"clients" | "agents">("clients");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BANNED">("ALL");

  const [banTarget,    setBanTarget]    = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionOk,     setActionOk]     = useState("");

  const [reactivating, setReactivating] = useState<string | null>(null);

  const reactivate = async (id: string) => {
    setReactivating(id);
    await fetch(`/api/admin/users/${id}/reactivate`, { method: "PATCH" });
    setReactivating(null);
    setActionOk("User reactivated.");
    router.refresh();
    setTimeout(() => setActionOk(""), 3000);
  };

  const onBanDone = () => {
    setBanTarget(null);
    setActionOk("User banned successfully.");
    router.refresh();
    setTimeout(() => setActionOk(""), 3000);
  };

  const onDeleteDone = () => {
    setDeleteTarget(null);
    setActionOk("User deleted permanently.");
    router.refresh();
    setTimeout(() => setActionOk(""), 3000);
  };

  const filterRows = <T extends { name: string | null; email: string; isActive: boolean }>(rows: T[]) =>
    rows
      .filter((u) =>
        !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter((u) =>
        statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? u.isActive : !u.isActive
      );

  const filteredClients = filterRows(clients);
  const filteredAgents  = filterRows(agents);
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

      {/* Success banner */}
      {actionOk && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{actionOk}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Tabs */}
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

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
        </select>

        <span className="text-xs text-muted-foreground ml-auto">{rows.length} user{rows.length !== 1 ? "s" : ""}</span>

        {/* Add agent button */}
        <Link
          href="/admin/users/new-agent"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Add Agent
        </Link>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No users match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
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
                        <ActionButtons u={u} setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} reactivate={reactivate} reactivating={reactivating} />
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
                      <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                      <td className="px-4 py-3">
                        <ActionButtons u={u} setBanTarget={setBanTarget} setDeleteTarget={setDeleteTarget} reactivate={reactivate} reactivating={reactivating} />
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ActionButtons({ u, setBanTarget, setDeleteTarget, reactivate, reactivating }: {
  u: { id: string; name: string | null; isActive: boolean };
  setBanTarget: (v: { id: string; name: string }) => void;
  setDeleteTarget: (v: { id: string; name: string }) => void;
  reactivate: (id: string) => void;
  reactivating: string | null;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/admin/users/${u.id}`}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted/20 transition-colors"
      >
        <Eye className="h-3 w-3" /> View
      </Link>
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
