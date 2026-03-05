"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle, Loader2, X } from "lucide-react";

export default function QuotationActions({ quotationId, status }: { quotationId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPT" | "REQUEST_REVISION" | "REJECT" | null>(null);
  const [showModal, setShowModal] = useState(false);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (action === "ACCEPT" && data.orderId) {
        router.push(`/client/orders/${data.orderId}`);
        return;
      }
      setShowModal(false);
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
    <>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-3">{error}</p>
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

        {/* Request Revision — opens modal */}
        <button
          onClick={() => { setError(""); setRevisionNotes(""); setShowModal(true); }}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-60 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Request Revision
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

      {/* Revision modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md mx-4 bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-semibold">Request a Revision</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Describe what you&apos;d like changed in the quotation.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={5}
                autoFocus
                placeholder="e.g. Please lower the unit price, source from a different region, or provide a faster lead time…"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setShowModal(false)}
                disabled={!!loading}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => act("REQUEST_REVISION")}
                disabled={!!loading || !revisionNotes.trim()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 transition-all"
              >
                {loading === "REQUEST_REVISION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
