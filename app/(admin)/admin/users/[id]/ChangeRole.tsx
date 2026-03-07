"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  userId: string;
  currentRole: string;
}

export default function ChangeRole({ userId, currentRole }: Props) {
  const router = useRouter();
  const [role,    setRole]    = useState<string>(currentRole === "CLIENT" ? "AGENT" : "CLIENT");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (role === currentRole) return;
    setLoading(true); setError(""); setSuccess("");
    const res  = await fetch(`/api/admin/users/${userId}/role`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to update role."); setLoading(false); return; }
    setSuccess(`Role updated to ${role}.`);
    setLoading(false);
    router.refresh();
  };

  if (currentRole === "ADMIN") return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Current:</span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            currentRole === "AGENT"
              ? "bg-purple-100 text-purple-800 border-purple-200"
              : "bg-emerald-100 text-emerald-800 border-emerald-200"
          }`}>
            {currentRole}
          </span>
          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setError(""); setSuccess(""); }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {currentRole !== "CLIENT" && <option value="CLIENT">CLIENT</option>}
          {currentRole !== "AGENT"  && <option value="AGENT">AGENT</option>}
        </select>

        <button
          onClick={handleSave}
          disabled={loading || role === currentRole}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </button>
      </div>

      {error   && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Admin promotion is not available through the UI. Use the terminal script:{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          npx ts-node scripts/make-admin.ts email@example.com
        </code>
      </p>
    </div>
  );
}
