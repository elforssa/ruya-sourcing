"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Download, FileText, Loader2,
  Clock, AlertCircle, Image as ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  orderId: string;
  status: string;
  totalAmount: number;
  paymentReceiptUrl: string | null;
  paymentSubmittedAt: Date | string | null;
  paymentConfirmedAt: Date | string | null;
  paymentRejectedReason: string | null;
  invoiceUrl: string | null;
}

export default function AdminPaymentSection({
  orderId,
  status,
  totalAmount,
  paymentReceiptUrl,
  paymentSubmittedAt,
  paymentConfirmedAt,
  paymentRejectedReason,
  invoiceUrl,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming]   = useState(false);
  const [rejecting,  setRejecting]    = useState(false);
  const [reason,     setReason]       = useState("");
  const [showReject, setShowReject]   = useState(false);
  const [error,      setError]        = useState("");
  const [success,    setSuccess]      = useState("");

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed.");
      setSuccess("Payment confirmed. Invoice generated and sent to client.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) { setError("Please enter a rejection reason."); return; }
    setRejecting(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/reject-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed.");
      setSuccess("Receipt rejected. Client has been notified to resubmit.");
      setShowReject(false);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRejecting(false);
    }
  };

  // ── Status badge ────────────────────────────────────────────────────────────
  const paymentStatus = () => {
    if (status === "PAID" || paymentConfirmedAt)
      return { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    if (paymentRejectedReason)
      return { label: "Rejected — awaiting resubmission", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
    if (paymentReceiptUrl)
      return { label: "Receipt submitted — pending review", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    return { label: "Awaiting payment from client", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  };
  const ps = paymentStatus();

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Payment Status</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${ps.bg} ${ps.text} ${ps.border}`}>
          {status === "PAID" ? <CheckCircle2 className="h-3.5 w-3.5" /> : paymentReceiptUrl ? <Clock className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {ps.label}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
        <span className="text-sm text-muted-foreground">Order Total</span>
        <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
      </div>

      {/* Confirmed at + Invoice */}
      {paymentConfirmedAt && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Payment confirmed</p>
              <p className="text-xs text-emerald-600">{new Date(paymentConfirmedAt).toLocaleString()}</p>
            </div>
          </div>
          {invoiceUrl && (
            <a
              href={invoiceUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5" /> Invoice PDF
            </a>
          )}
        </div>
      )}

      {/* Receipt preview */}
      {paymentReceiptUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" /> Payment Receipt
            </p>
            {paymentSubmittedAt && (
              <span className="text-xs text-muted-foreground">
                Submitted {new Date(paymentSubmittedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-muted/10 overflow-hidden">
            {paymentReceiptUrl.toLowerCase().endsWith(".pdf") ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">PDF receipt</p>
                <a
                  href={paymentReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/20 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
            ) : (
              <div className="space-y-3 p-3">
                <img
                  src={paymentReceiptUrl}
                  alt="Payment receipt"
                  className="max-h-72 mx-auto rounded-lg object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex justify-center">
                  <a
                    href={paymentReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> View full size / download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </p>
      )}

      {/* Action buttons — only when receipt is present and not yet confirmed */}
      {paymentReceiptUrl && !paymentConfirmedAt && (
        <div className="space-y-3">
          {!showReject ? (
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: confirming ? "#6b7280" : "#16a34a" }}
              >
                {confirming
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Confirm Payment Received</>}
              </button>
              <button
                onClick={() => { setShowReject(true); setError(""); }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <XCircle className="h-4 w-4" /> Reject Receipt
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Rejection reason</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Amount doesn't match, blurry image, wrong account…"
                rows={3}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-all"
                >
                  {rejecting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Rejecting…</>
                    : "Send Rejection"}
                </button>
                <button
                  onClick={() => { setShowReject(false); setReason(""); setError(""); }}
                  className="px-4 rounded-lg border text-sm font-medium hover:bg-muted/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No receipt yet */}
      {!paymentReceiptUrl && !paymentConfirmedAt && (
        <p className="text-sm text-center text-muted-foreground py-4 border rounded-lg bg-muted/10">
          No payment receipt submitted yet.
        </p>
      )}
    </div>
  );
}
