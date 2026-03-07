"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

interface Props {
  userId: string;
  userName: string;
  currentRole: string;
}

export default function ChangeRole({ userId, userName, currentRole }: Props) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<string>(currentRole === "CLIENT" ? "AGENT" : "CLIENT");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const confirmChange = async () => {
    setLoading(true); setError("");
    const res  = await fetch(`/api/admin/users/${userId}/role`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role: pendingRole }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to update role."); setShowConfirm(false); return; }
    setSuccess(`Role updated to ${pendingRole}. A notification email has been sent.`);
    setShowConfirm(false);
    router.refresh();
  };

  if (currentRole === "ADMIN") return null;

  const roleBadgeCls = (r: string) =>
    r === "AGENT"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <>
      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-base">Confirm Role Change</h3>
              </div>
              <button onClick={() => setShowConfirm(false)} className="rounded-lg p-1 hover:bg-muted/40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to change{" "}
              <span className="font-semibold text-foreground">{userName}</span>
              {"'"}s role from{" "}
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mx-0.5 ${roleBadgeCls(currentRole)}`}>
                {currentRole}
              </span>
              {" "}to{" "}
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mx-0.5 ${roleBadgeCls(pendingRole)}`}>
                {pendingRole}
              </span>
              {"?"}
            </p>

            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              The user will receive an email notifying them of this change.
              Their portal access and available features will update immediately.
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={confirmChange}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Change
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-xs">Current:</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeCls(currentRole)}`}>
              {currentRole}
            </span>
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <select
            value={pendingRole}
            onChange={(e) => { setPendingRole(e.target.value); setError(""); setSuccess(""); }}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {currentRole !== "CLIENT" && <option value="CLIENT">CLIENT</option>}
            {currentRole !== "AGENT"  && <option value="AGENT">AGENT</option>}
          </select>

          <button
            onClick={() => { setError(""); setSuccess(""); setShowConfirm(true); }}
            disabled={pendingRole === currentRole}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            Update Role
          </button>
        </div>

        {error   && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Admin promotion is not available through the UI. Use:{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            npx tsx scripts/make-admin.ts email@example.com
          </code>
        </p>
      </div>
    </>
  );
}
