"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Download, Truck, CheckCircle2, Loader2, AlertCircle, Tag,
} from "lucide-react";

interface Props {
  orderId: string;
  readOnly?: boolean;
  initial: {
    ref: string | null;
    cartons: number | null;
    netWeight: string | null;
    grossWeight: string | null;
    dimensions: string | null;
    notes: string | null;
    sentAt: Date | string | null;
  };
}

export default function ShippingMarkSection({ orderId, initial, readOnly = false }: Props) {
  const router = useRouter();

  const [cartons,     setCartons]     = useState(initial.cartons     ? String(initial.cartons) : "");
  const [netWeight,   setNetWeight]   = useState(initial.netWeight   ?? "");
  const [grossWeight, setGrossWeight] = useState(initial.grossWeight ?? "");
  const [dimensions,  setDimensions]  = useState(initial.dimensions  ?? "");
  const [notes,       setNotes]       = useState(initial.notes       ?? "");

  const [savedRef, setSavedRef] = useState<string | null>(initial.ref);
  const [sentAt,   setSentAt]   = useState<string | null>(
    initial.sentAt ? new Date(initial.sentAt).toISOString() : null
  );

  const [saving,    setSaving]    = useState(false);
  const [marking,   setMarking]   = useState(false);
  const [error,     setError]     = useState("");
  const [saveOk,    setSaveOk]    = useState(false);

  const save = async (opts: { markAsSent?: boolean } = {}) => {
    const isMark = !!opts.markAsSent;
    isMark ? setMarking(true) : setSaving(true);
    setError(""); setSaveOk(false);
    try {
      const res  = await fetch(`/api/agent/orders/${orderId}/shipping-mark`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartons, netWeight, grossWeight, dimensions, notes, markAsSent: isMark }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSavedRef(data.ref);
      if (data.sentAt) setSentAt(new Date(data.sentAt).toISOString());
      setSaveOk(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false); setMarking(false);
    }
  };

  const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-5">

      {/* Generated ref badge */}
      {savedRef && (
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-3">
          <Tag className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Shipping Mark Reference</p>
            <p className="font-mono font-bold text-base text-primary">{savedRef}</p>
          </div>
          {sentAt && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3" /> Sent to supplier
            </div>
          )}
        </div>
      )}

      {/* Read-only summary */}
      {readOnly ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cartons</p>
              <p className="font-semibold text-sm">{initial.cartons ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net Weight</p>
              <p className="font-semibold text-sm">{initial.netWeight ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gross Weight</p>
              <p className="font-semibold text-sm">{initial.grossWeight ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dimensions</p>
              <p className="font-semibold text-sm">{initial.dimensions ?? "—"}</p>
            </div>
          </div>
          {initial.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{initial.notes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {savedRef && (
              <a
                href={`/api/orders/${orderId}/shipping-mark-pdf`}
                download={`ShippingMark-${savedRef}.pdf`}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            )}
            {sentAt && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Sent on {new Date(sentAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* Form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Number of cartons / boxes</label>
          <input
            type="number" min="1"
            value={cartons}
            onChange={(e) => setCartons(e.target.value)}
            placeholder="e.g. 24"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Net weight (kg)</label>
          <input
            type="text"
            value={netWeight}
            onChange={(e) => setNetWeight(e.target.value)}
            placeholder="e.g. 120"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Gross weight (kg)</label>
          <input
            type="text"
            value={grossWeight}
            onChange={(e) => setGrossWeight(e.target.value)}
            placeholder="e.g. 135"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Dimensions (cm) — L × W × H</label>
          <input
            type="text"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="e.g. 60×40×50"
            className={inputCls}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Additional notes for factory / supplier</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Fragile — handle with care. Stack max 3 layers."
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Tip: include &quot;fragile&quot; or &quot;handle with care&quot; to show a warning banner on the PDF.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </p>
      )}
      {saveOk && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Shipping mark saved successfully.
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Save */}
        <button
          onClick={() => save()}
          disabled={saving || marking}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Shipping Mark
        </button>

        {/* Download PDF (only after saved) */}
        {savedRef && (
          <a
            href={`/api/orders/${orderId}/shipping-mark-pdf`}
            download={`ShippingMark-${savedRef}.pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
          >
            <Download className="h-4 w-4" /> Generate PDF
          </a>
        )}

        {/* Mark as sent (only after saved, only if not already sent) */}
        {savedRef && !sentAt && (
          <button
            onClick={() => save({ markAsSent: true })}
            disabled={saving || marking}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-all"
          >
            {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Mark as Sent to Supplier
          </button>
        )}

        {/* Already sent badge */}
        {sentAt && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Sent on {new Date(sentAt).toLocaleDateString()}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
