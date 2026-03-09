"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, DollarSign } from "lucide-react";

type Props = {
  requestId: string;
  quantity: number;
  prefill?: {
    supplierLocation: string | null;
    unitPrice: number;
    estimatedLeadTime: number | null;
    shippingCostEstimate: number | null;
    notes: string | null;
  } | null;
  isRevision: boolean;
};

export default function QuotationForm({ requestId, quantity, prefill, isRevision }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [supplierLocation, setSupplierLocation] = useState(prefill?.supplierLocation ?? "");
  const [unitPrice, setUnitPrice] = useState(prefill?.unitPrice?.toString() ?? "");
  const [totalPrice, setTotalPrice] = useState("");
  const [estimatedLeadTime, setEstimatedLeadTime] = useState(prefill?.estimatedLeadTime?.toString() ?? "");
  const [shippingCostEstimate, setShippingCostEstimate] = useState(prefill?.shippingCostEstimate?.toString() ?? "");
  const [notes, setNotes] = useState(prefill?.notes ?? "");

  useEffect(() => {
    const u = parseFloat(unitPrice);
    if (!isNaN(u) && u > 0) {
      setTotalPrice((u * quantity).toFixed(2));
    } else {
      setTotalPrice("");
    }
  }, [unitPrice, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitPrice || isNaN(parseFloat(unitPrice))) {
      setError("Unit price is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/agent/requests/${requestId}/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierLocation,
          unitPrice,
          totalPrice,
          estimatedLeadTime,
          shippingCostEstimate,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full rounded-lg border border-input px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Supplier */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
          Supplier Location
        </label>
        <input
          type="text"
          value={supplierLocation}
          onChange={(e) => setSupplierLocation(e.target.value)}
          placeholder="e.g. Shenzhen, China"
          className={field}
        />
      </div>

      {/* Pricing */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pricing
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Unit Price (USD) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="16.80"
                className={`${field} pl-8`}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Total Price (× {quantity.toLocaleString()} units)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                readOnly
                value={totalPrice}
                placeholder="Auto-calculated"
                className={`${field} pl-8 bg-muted/50 text-muted-foreground cursor-not-allowed`}
                tabIndex={-1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Shipping Estimate (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingCostEstimate}
                onChange={(e) => setShippingCostEstimate(e.target.value)}
                placeholder="320.00"
                className={`${field} pl-8`}
              />
            </div>
          </div>
        </div>

        {/* Live total summary */}
        {totalPrice && (
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Subtotal: <span className="font-semibold text-foreground">${parseFloat(totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
            {shippingCostEstimate && !isNaN(parseFloat(shippingCostEstimate)) && (
              <>
                <span className="text-muted-foreground">+</span>
                <span className="text-muted-foreground">Shipping: <span className="font-semibold text-foreground">${parseFloat(shippingCostEstimate).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
                <span className="text-muted-foreground">+</span>
                <span className="text-muted-foreground font-semibold">
                  Total: <span className="text-foreground text-base">${(parseFloat(totalPrice) + parseFloat(shippingCostEstimate)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lead time */}
      <div className="w-48">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
          Lead Time (days)
        </label>
        <input
          type="number"
          min="1"
          value={estimatedLeadTime}
          onChange={(e) => setEstimatedLeadTime(e.target.value)}
          placeholder="25"
          className={field}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
          Agent Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Include MOQ details, sample availability, payment terms, certifications…"
          className={`${field} resize-none`}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
        ) : (
          <><Send className="h-4 w-4" /> {isRevision ? "Submit Revised Quotation" : "Submit Quotation"}</>
        )}
      </button>
    </form>
  );
}
