"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Tag,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Upload,
  Link2,
  ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type FormData = {
  productName: string;
  description: string;
  quantity: string;
  targetPrice: string;
  destinationCountry: string;
  phoneNumber: string;
  serviceType: "FULL_SOURCING" | "PRICE_CHECK" | "INSPECTION" | "";
  notes: string;
};

const SERVICE_TYPES = [
  {
    id: "FULL_SOURCING" as const,
    label: "Full Sourcing",
    description:
      "Find the right supplier, negotiate prices, and manage the end-to-end sourcing process for you.",
    icon: Globe,
  },
  {
    id: "PRICE_CHECK" as const,
    label: "Price Check",
    description:
      "Get competitive price quotes from multiple verified suppliers for a product you've already identified.",
    icon: Tag,
  },
  {
    id: "INSPECTION" as const,
    label: "Inspection",
    description:
      "Pre-shipment quality inspection of your goods to ensure they meet your specifications before delivery.",
    icon: Search,
  },
];

const STEPS = ["Product Details", "Service Type", "Review & Submit"];

export default function NewRequestPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [formData, setFormData] = useState<FormData>({
    productName: "",
    description: "",
    quantity: "",
    targetPrice: "",
    destinationCountry: "",
    phoneNumber: "",
    serviceType: "",
    notes: "",
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [linkError, setLinkError] = useState("");

  const update = (field: keyof FormData, value: string | string[]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const clearError = (field: keyof FormData) =>
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!formData.productName.trim()) e.productName = "Product name is required.";
    if (!formData.quantity || parseInt(formData.quantity) < 1)
      e.quantity = "Enter a valid quantity (min 1).";
    if (formData.targetPrice && isNaN(parseFloat(formData.targetPrice)))
      e.targetPrice = "Enter a valid price.";
    if (!formData.phoneNumber.trim())
      e.phoneNumber = "Phone number is required.";
    else if (formData.phoneNumber.trim().length < 10)
      e.phoneNumber = "Enter a valid phone number (min 10 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (!formData.serviceType) {
      setErrors({ serviceType: "Please select a service type." });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toUpload = files.slice(0, 5 - uploadedImages.length);
    setUploading(true);
    setImageError("");
    for (const file of toUpload) {
      const fd = new window.FormData();
      fd.append("image", file);
      try {
        const res = await fetch("/api/uploads/product-image", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          setUploadedImages((prev) => [...prev, data.url]);
        } else {
          setImageError(data.error || "Upload failed.");
        }
      } catch {
        setImageError("Upload failed. Please try again.");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedImage = (idx: number) =>
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    try { new URL(url); } catch { setLinkError("Enter a valid URL."); return; }
    if (referenceLinks.length >= 5) { setLinkError("Maximum 5 links allowed."); return; }
    setReferenceLinks((prev) => [...prev, url]);
    setLinkInput("");
    setLinkError("");
  };

  const removeLink = (idx: number) =>
    setReferenceLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const allRefs = [...uploadedImages, ...referenceLinks];
      const res = await fetch("/api/client/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, referenceImages: allRefs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setRequestId(data.id);
      setSubmitted(true);
    } catch (err) {
      setErrors({ notes: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const serviceInfo = SERVICE_TYPES.find((s) => s.id === formData.serviceType);

  /* ── Success Screen with confetti ── */
  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 relative overflow-hidden">
        {/* CSS confetti */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 w-2 h-2 rounded-sm animate-confetti-fall"
              style={{
                left: `${4 + (i * 4)}%`,
                backgroundColor: i % 3 === 0 ? "hsl(var(--accent))" : i % 3 === 1 ? "hsl(var(--primary))" : "#e2e8f0",
                animationDelay: `${i * 0.12}s`,
                animationDuration: `${1.8 + (i % 5) * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-md w-full text-center relative z-10">
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h1>
          <p className="text-muted-foreground mb-2">
            Your sourcing request for <span className="font-semibold text-foreground">{formData.productName}</span> has been submitted successfully.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            Reference: <span className="font-mono bg-muted px-2 py-1 rounded-md">{requestId.slice(-10).toUpperCase()}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/client/requests")}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 btn-press transition-all"
            >
              View My Requests <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/client/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-border hover:bg-muted/50 btn-press transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">New Sourcing Request</h1>
        <p className="text-muted-foreground mt-1">Fill in the details below and our agents will get back to you.</p>
      </div>

      {/* Step indicator — pill style with gold accents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((label, idx) => {
            const n = idx + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      done
                        ? "bg-accent text-accent-foreground"
                        : active
                        ? "bg-accent text-accent-foreground ring-4 ring-accent/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : n}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      done ? "text-accent" : active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 transition-colors ${
                      step > n ? "bg-accent" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border-0 bg-card shadow-elevation-1">

        {/* ── STEP 1: Product Details ── */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">Product Details</h2>

            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Product Name <span className="text-destructive">*</span>
              </label>
              <input
                id="productName"
                type="text"
                value={formData.productName}
                onChange={(e) => { update("productName", e.target.value); clearError("productName"); }}
                placeholder="e.g. Custom Bluetooth Earbuds"
                className={`w-full h-12 rounded-lg border px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${errors.productName ? "border-destructive" : "border-input"}`}
              />
              {errors.productName && <p className="text-xs text-destructive mt-1">{errors.productName}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe the product specifications, quality requirements, packaging preferences…"
                rows={4}
                className="w-full rounded-lg border border-input px-4 py-3 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Quantity <span className="text-destructive">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => { update("quantity", e.target.value); clearError("quantity"); }}
                  placeholder="500"
                  className={`w-full h-12 rounded-lg border px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${errors.quantity ? "border-destructive" : "border-input"}`}
                />
                {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label htmlFor="targetPrice" className="block text-sm font-medium text-muted-foreground mb-1.5">Target Unit Price (USD)</label>
                <input
                  id="targetPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetPrice}
                  onChange={(e) => { update("targetPrice", e.target.value); clearError("targetPrice"); }}
                  placeholder="18.50"
                  className={`w-full h-12 rounded-lg border px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${errors.targetPrice ? "border-destructive" : "border-input"}`}
                />
                {errors.targetPrice && <p className="text-xs text-destructive mt-1">{errors.targetPrice}</p>}
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-muted-foreground mb-1.5">Destination Country</label>
                <input
                  id="destination"
                  type="text"
                  value={formData.destinationCountry}
                  onChange={(e) => update("destinationCountry", e.target.value)}
                  placeholder="United States"
                  className="w-full h-12 rounded-lg border border-input px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-muted-foreground mb-1.5">
                WhatsApp / Phone Number <span className="text-destructive">*</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => { update("phoneNumber", e.target.value); clearError("phoneNumber"); }}
                placeholder="+1 234 567 8900"
                className={`w-full h-12 rounded-lg border px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${errors.phoneNumber ? "border-destructive" : "border-input"}`}
              />
              {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
              <p className="text-xs text-muted-foreground mt-1.5">
                Used for request updates, urgent clarifications, and shipping/payment support.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Service Type ── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">Select Service Type</h2>
            <p className="text-sm text-muted-foreground -mt-2">Choose the type of sourcing support you need.</p>
            {errors.serviceType && (
              <p className="text-xs text-destructive">{errors.serviceType}</p>
            )}
            <div className="grid grid-cols-1 gap-4">
              {SERVICE_TYPES.map(({ id, label, description, icon: Icon }) => {
                const selected = formData.serviceType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { update("serviceType", id); setErrors({}); }}
                    className={`relative flex items-start gap-4 w-full text-left rounded-xl border-2 p-5 transition-all ${
                      selected
                        ? "border-accent ring-4 ring-accent/20"
                        : "border-border hover:border-muted-foreground/30 hover:-translate-y-0.5 hover:shadow-elevation-1"
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      selected ? "bg-accent/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-5 w-5 ${selected ? "text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {selected && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Review & Submit</h2>

            {/* Review summary */}
            <div className="rounded-xl bg-muted/30 p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
              <div className="space-y-2.5">
                {[
                  { label: "Product", value: formData.productName },
                  { label: "Service", value: serviceInfo?.label ?? "—" },
                  { label: "Quantity", value: `${parseInt(formData.quantity).toLocaleString()} units` },
                  { label: "Target Price", value: formData.targetPrice ? formatCurrency(parseFloat(formData.targetPrice)) : "Not specified" },
                  { label: "Destination", value: formData.destinationCountry || "Not specified" },
                ].map(({ label, value }, i) => (
                  <div key={label} className={`flex items-center justify-between text-sm py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
              {formData.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p className="text-sm line-clamp-3">{formData.description}</p>
                </div>
              )}
            </div>

            {/* Section A: Product Images */}
            <div className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Product Images</p>
                </div>
                <span className="text-xs text-muted-foreground">{uploadedImages.length}/5</span>
              </div>
              <p className="text-xs text-muted-foreground">Upload product photos (JPG, PNG, WEBP · max 10 MB each). Optional.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              {uploadedImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-accent/40 px-4 py-6 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all disabled:opacity-50 disabled:pointer-events-none flex flex-col items-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-5 w-5" /> Click to upload images</>
                  )}
                </button>
              )}

              {imageError && <p className="text-xs text-destructive">{imageError}</p>}

              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative shrink-0 group">
                      <img
                        src={url}
                        alt={`Product image ${i + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Reference Links */}
            <div className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Reference Links</p>
                </div>
                <span className="text-xs text-muted-foreground">{referenceLinks.length}/5</span>
              </div>
              <p className="text-xs text-muted-foreground">Paste links to product pages or references (e.g. Alibaba, Amazon). Optional.</p>

              {referenceLinks.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => { setLinkInput(e.target.value); setLinkError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                    placeholder="https://alibaba.com/product..."
                    className={`flex-1 h-12 rounded-lg border px-4 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${linkError ? "border-destructive" : "border-input"}`}
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 h-12 bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 btn-press transition-all shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              )}

              {linkError && <p className="text-xs text-destructive">{linkError}</p>}

              {referenceLinks.length > 0 && (
                <div className="space-y-1.5">
                  {referenceLinks.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-muted-foreground hover:text-accent transition-colors"
                      >
                        {url}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                        aria-label="Remove link"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-muted-foreground mb-1.5">Additional Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Any special requirements, deadlines, certifications, packaging instructions…"
                rows={4}
                className="w-full rounded-lg border border-input px-4 py-3 text-sm bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-all"
              />
              {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 rounded-b-xl">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium border border-border hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none btn-press transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 btn-press transition-all"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none btn-press transition-all"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit Request <Check className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
