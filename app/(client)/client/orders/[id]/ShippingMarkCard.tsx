"use client";

import { Download, Package, CheckCircle2, Clock } from "lucide-react";

interface Props {
  orderId: string;
  markRef: string;
  cartons: number | null;
  sentAt: Date | string | null;
}

export default function ShippingMarkCard({ orderId, markRef: smRef, cartons, sentAt }: Props) {
  return (
    <div className="space-y-4">
      {/* Reference + cartons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Reference Number</p>
          <p className="font-mono font-bold text-base text-primary">{smRef}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Number of Cartons</p>
          <p className="font-bold text-base">{cartons ?? "—"}</p>
        </div>
      </div>

      {/* Sent to supplier status */}
      {sentAt ? (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Sent to supplier</p>
            <p className="text-xs text-emerald-600">{new Date(sentAt).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Shipping mark prepared — not yet sent to supplier</p>
        </div>
      )}

      {/* Download */}
      <a
        href={`/api/orders/${orderId}/shipping-mark-pdf`}
        download={`ShippingMark-${smRef}.pdf`}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Download className="h-4 w-4" /> Download Shipping Mark PDF
      </a>
    </div>
  );
}
