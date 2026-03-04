"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

const STATUSES = [
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
];

interface Props {
  orderId: string;
  currentStatus: string;
  currentCarrier?: string | null;
  currentTracking?: string | null;
  currentDelivery?: string | null;
  currentShippingMark?: string | null;
}

export default function OrderStatusForm({
  orderId,
  currentStatus,
  currentCarrier,
  currentTracking,
  currentDelivery,
  currentShippingMark,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [carrier, setCarrier] = useState(currentCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(currentTracking ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    currentDelivery ? currentDelivery.slice(0, 10) : ""
  );
  const [shippingMark, setShippingMark] = useState(currentShippingMark ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const showShipping = status === "SHIPPED" || status === "DELIVERED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/agent/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          carrier: carrier || null,
          trackingNumber: trackingNumber || null,
          estimatedDelivery: estimatedDelivery || null,
          shippingMark: shippingMark || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Status select */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Order Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Shipping fields — shown when SHIPPED or DELIVERED */}
      {showShipping && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
          <p className="text-sm font-semibold text-blue-800">Shipping Information</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Carrier</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. DHL, FedEx, UPS"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z9999999"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated Delivery Date</label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Shipping Mark / Reference</label>
              <input
                type="text"
                value={shippingMark}
                onChange={(e) => setShippingMark(e.target.value)}
                placeholder="e.g. RUYA-2024-001"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">Order updated successfully.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Update Order
      </button>
    </form>
  );
}
