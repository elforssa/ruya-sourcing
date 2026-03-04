"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function QuotationActions({ quotationId, status }: { quotationId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPT" | "REQUEST_REVISION" | "REJECT" | null>(null);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [error, setError] = useState("");

  const canAct = status === "PENDING";

  const act = async (action: "ACCEPT" | "REQUEST_REVISION" | "REJECT") => {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/client/quotations/${quotationId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revisionNotes: action === "REQUEST_REVISION" ? revisionNotes : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  if (!canAct) {
    const map: Record<string, { label: string; className: string }> = {
      ACCEPTED: { label: "Quotation Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      REVISION_REQUESTED: { label: "Revision Requested", className: "bg-orange-50 text-orange-700 border-orange-200" },
      REJECTED: { label: "Quotation Rejected", className: "bg-red-50 text-red-700 border-red-200" },
    };
    const info = map[status];
    if (!info) return null;
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${info.className}`}>
        <CheckCircle2 className="h-4 w-4" />
        {info.label}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Accept */}
        <button
          onClick={() => act("ACCEPT")}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-all"
        >
          {loading === "ACCEPT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Accept Quotation
        </button>

        {/* Request Revision toggle */}
        <button
          onClick={() => setShowRevision((v) => !v)}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-60 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Request Revision
          {showRevision ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Reject */}
        <button
          onClick={() => act("REJECT")}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60 transition-all"
        >
          {loading === "REJECT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Reject
        </button>
      </div>

      {/* Revision notes panel */}
      {showRevision && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
          <p className="text-sm font-medium text-orange-800">What changes would you like?</p>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={3}
            placeholder="Describe the changes you'd like to the quotation…"
            className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
          <button
            onClick={() => act("REQUEST_REVISION")}
            disabled={!!loading || !revisionNotes.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 transition-all"
          >
            {loading === "REQUEST_REVISION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Submit Revision Request
          </button>
        </div>
      )}
    </div>
  );
}
