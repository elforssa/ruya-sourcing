"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Trash2, Loader2, AlertTriangle, X } from "lucide-react";

interface Props {
  userId: string;
  userName: string;
  isActive: boolean;
  bannedReason: string | null;
}

export default function DangerZone({ userId, userName, isActive, bannedReason }: Props) {
  const router = useRouter();
  const [showBan,    setShowBan]    = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reason,     setReason]     = useState("");
  const [banning,    setBanning]    = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [error,      setError]      = useState("");

  const ban = async () => {
    if (!reason.trim()) { setError("Please enter a reason."); return; }
    setBanning(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}/ban`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); setBanning(false); return; }
    setShowBan(false);
    router.refresh();
  };

  const reactivate = async () => {
    setReactivating(true);
    await fetch(`/api/admin/users/${userId}/reactivate`, { method: "PATCH" });
    setReactivating(false);
    router.refresh();
  };

  const deleteUser = async () => {
    setDeleting(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); setDeleting(false); return; }
    router.push("/admin/users");
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* If banned, show reactivate */}
      {!isActive && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3 mb-3">
            <UserX className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-red-800">Account is banned</p>
              {bannedReason && <p className="text-sm text-red-600 mt-0.5">Reason: {bannedReason}</p>}
            </div>
          </div>
          <button
            onClick={reactivate}
            disabled={reactivating}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 transition-all"
          >
            {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Reactivate Account
          </button>
        </div>
      )}

      {/* Ban button */}
      {isActive && (
        !showBan ? (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-semibold text-sm">Suspend Account</p>
              <p className="text-xs text-muted-foreground">Prevent this user from signing in.</p>
            </div>
            <button
              onClick={() => { setShowBan(true); setError(""); }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
            >
              <UserX className="h-4 w-4" /> Ban User
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-red-800">Ban {userName}</p>
              <button onClick={() => { setShowBan(false); setReason(""); setError(""); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for banning (e.g. Terms of service violation)…"
              rows={3}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={ban}
                disabled={banning}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
              >
                {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Ban"}
              </button>
              <button
                onClick={() => { setShowBan(false); setReason(""); setError(""); }}
                className="px-4 rounded-lg border text-sm font-medium hover:bg-muted/20"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      )}

      {/* Delete button */}
      {!showDelete ? (
        <div className="flex items-center justify-between rounded-lg border border-red-200 p-4">
          <div>
            <p className="font-semibold text-sm text-red-700">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete all data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => { setShowDelete(true); setError(""); }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-all"
          >
            <Trash2 className="h-4 w-4" /> Delete User
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-800">Permanently delete {userName}?</p>
              <p className="text-xs text-red-700 mt-1">
                This will permanently delete all their requests, quotations, orders, and notifications.
                This action <strong>cannot be undone</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={deleteUser}
              disabled={deleting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-all"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Permanently"}
            </button>
            <button
              onClick={() => { setShowDelete(false); setError(""); }}
              className="px-4 rounded-lg border text-sm font-medium hover:bg-muted/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
