"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  orderId: string;
  totalAmount: number;
  existingReceiptUrl?: string | null;
  rejectedReason?: string | null;
}

export default function PaymentUpload({
  orderId,
  totalAmount,
  existingReceiptUrl,
  rejectedReason,
}: Props) {
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingReceiptUrl && !rejectedReason);
  const [error, setError]     = useState("");
  const inputRef              = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) {
      setError("Only JPG, PNG, or PDF files are accepted."); return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("receipt", file);
    try {
      const res  = await fetch(`/api/orders/${orderId}/receipt`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-base mb-1">Receipt submitted</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your payment receipt has been submitted and is pending review. We&apos;ll confirm it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rejection reason */}
      {rejectedReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 mb-0.5">Receipt rejected — please resubmit</p>
            <p className="text-sm text-red-600">{rejectedReason}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Payment Instructions</p>
        <p className="text-sm text-amber-700 leading-relaxed">
          Please transfer the total amount to our bank account and upload your payment receipt below.
          Once verified, your order will proceed to production.
        </p>
      </div>

      {/* Amount due */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground font-medium">Amount due</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/20"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="space-y-3">
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-52 mx-auto rounded-lg object-contain shadow" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mx-auto transition-colors"
            >
              <X className="h-3 w-3" /> Remove file
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Click or drag to upload receipt</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · Max 5 MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="w-full rounded-lg py-3 text-sm font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: file && !uploading ? "#C9A84C" : undefined, color: file && !uploading ? "#0B1F3B" : undefined }}
      >
        {uploading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          : "I Have Paid — Submit Receipt"}
      </button>
    </div>
  );
}
