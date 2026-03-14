"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, CreditCard, Cog, Truck, PackageCheck, CheckCircle2, AlertCircle,
} from "lucide-react";

const NEXT_STATUS: Record<string, { status: string; label: string; icon: typeof Truck; color: string; bgColor: string }> = {
  CONFIRMED:       { status: "PAYMENT_PENDING", label: "Set to Payment Pending", icon: CreditCard,   color: "text-amber-700",   bgColor: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
  PAID:            { status: "IN_PRODUCTION",   label: "Start Production",       icon: Cog,           color: "text-violet-700",  bgColor: "bg-violet-50 border-violet-200 hover:bg-violet-100" },
  IN_PRODUCTION:   { status: "SHIPPED",         label: "Mark as Shipped",        icon: Truck,         color: "text-blue-700",    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  SHIPPED:         { status: "DELIVERED",        label: "Mark as Delivered",      icon: PackageCheck,  color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
};

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

  const [carrier, setCarrier] = useState(currentCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(currentTracking ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    currentDelivery ? currentDelivery.slice(0, 10) : ""
  );
  const [shippingMark, setShippingMark] = useState(currentShippingMark ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const next = NEXT_STATUS[currentStatus];
  const isShippedOrDelivered = currentStatus === "SHIPPED" || currentStatus === "DELIVERED";
  const isTransitionToShipped = next?.status === "SHIPPED";

  const handleTransition = async () => {
    if (!next) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/agent/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next.status,
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

  const handleUpdateShipping = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/agent/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus,
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

  const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">

      {/* Current status badge */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Current Status</p>
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
          {currentStatus.replace(/_/g, " ")}
        </span>
      </div>

      {/* PAYMENT_PENDING: Agent cannot advance — admin confirms payment */}
      {currentStatus === "PAYMENT_PENDING" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <p className="text-sm text-amber-800 font-medium">Waiting for payment</p>
          <p className="text-xs text-amber-700 mt-1">
            The client needs to upload a payment receipt. Once the admin confirms payment, the status will move to Paid.
          </p>
        </div>
      )}

      {/* DELIVERED: Order complete */}
      {currentStatus === "DELIVERED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm text-emerald-800 font-medium">Order delivered</p>
            <p className="text-xs text-emerald-700 mt-0.5">This order is complete. No further actions needed.</p>
          </div>
        </div>
      )}

      {/* Shipping fields — shown when transitioning to SHIPPED, or when already SHIPPED/DELIVERED */}
      {(isTransitionToShipped || isShippedOrDelivered) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
          <p className="text-sm font-semibold text-blue-800">Shipping Information</p>
          {isTransitionToShipped && (
            <p className="text-xs text-blue-700">
              Carrier and tracking number are required before marking as shipped.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Carrier {isTransitionToShipped && <span className="text-destructive">*</span>}
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. DHL, FedEx, UPS"
                readOnly={currentStatus === "DELIVERED"}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tracking Number {isTransitionToShipped && <span className="text-destructive">*</span>}
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z9999999"
                readOnly={currentStatus === "DELIVERED"}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated Delivery Date</label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                readOnly={currentStatus === "DELIVERED"}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Shipping Mark / Reference</label>
              <input
                type="text"
                value={shippingMark}
                onChange={(e) => setShippingMark(e.target.value)}
                placeholder="e.g. RUYA-2024-001"
                readOnly={currentStatus === "DELIVERED"}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          {/* Save shipping details button (only when already SHIPPED, to allow updating tracking info) */}
          {currentStatus === "SHIPPED" && (
            <button
              onClick={handleUpdateShipping}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              Save Shipping Details
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Order updated successfully.
        </p>
      )}

      {/* Next step button */}
      {next && currentStatus !== "PAYMENT_PENDING" && (
        <button
          onClick={handleTransition}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition-all ${next.color} ${next.bgColor}`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <next.icon className="h-4 w-4" />}
          {next.label}
        </button>
      )}
    </div>
  );
}
