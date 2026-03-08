"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count: { sourcingRequests: number; quotations: number };
};

export default function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);
  const [localActive, setLocalActive] = useState<Record<string, boolean>>(
    Object.fromEntries(users.map((u) => [u.id, u.isActive]))
  );
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CLIENT" | "AGENT">("ALL");

  const filtered = users.filter((u) => roleFilter === "ALL" || u.role === roleFilter);

  const toggle = async (userId: string) => {
    setToggling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalActive((s) => ({ ...s, [userId]: data.isActive }));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setToggling(null);
    }
  };

  const select = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Role</span>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className={select}>
            <option value="ALL">All Roles</option>
            <option value="CLIENT">Clients</option>
            <option value="AGENT">Agents</option>
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((user) => {
          const active = localActive[user.id] ?? user.isActive;
          return (
            <div key={user.id} className={`rounded-xl border bg-card p-4 space-y-3 ${!active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(user.name ?? user.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>{active ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.role === "AGENT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role === "AGENT" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {user.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.role === "CLIENT" ? `${user._count.sourcingRequests} requests` : `${user._count.quotations} quotations`}
                  </span>
                </div>
                <button
                  onClick={() => toggle(user.id)}
                  disabled={toggling === user.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-60 ${
                    active ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100" : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {toggling === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["User", "Role", "Activity", "Joined", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => {
              const active = localActive[user.id] ?? user.isActive;
              return (
                <tr key={user.id} className={`transition-colors ${active ? "hover:bg-muted/20" : "bg-muted/30 opacity-60"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{(user.name ?? user.email)[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.role === "AGENT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "AGENT" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {user.role === "CLIENT" ? `${user._count.sourcingRequests} requests` : `${user._count.quotations} quotations`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>{active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(user.id)}
                      disabled={toggling === user.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-60 ${
                        active ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100" : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      {toggling === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
