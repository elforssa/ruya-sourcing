export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Package,
  Hash,
  Calendar,
  Globe,
  Tag,
  Search,
  FileText,
  Truck,
  Clock,
  DollarSign,
  ExternalLink,
  History,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import QuotationActions from "./QuotationActions";

const TIMELINE_STEPS = [
  { key: "DRAFT",          label: "Draft" },
  { key: "SUBMITTED",      label: "Submitted" },
  { key: "ASSIGNED",       label: "Assigned" },
  { key: "QUOTATION_SENT", label: "Quotation Sent" },
  { key: "VALIDATED",      label: "Validated" },
  { key: "CONVERTED",      label: "Order Created" },
];

const SERVICE_ICONS: Record<string, React.ElementType> = {
  FULL_SOURCING: Globe,
  PRICE_CHECK:   Tag,
  INSPECTION:    Search,
};

function StatusTimeline({ current }: { current: string }) {
  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.key === current);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const done   = idx < currentIdx;
          const active = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className="h-0.5 w-14 mx-1 mb-5 rounded-full transition-colors"
                  style={{ background: done ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) return null;

  const request = await prisma.sourcingRequest.findUnique({
    where: { id: params.id },
    include: {
      quotations: { orderBy: { version: "desc" } },
      agent: { select: { name: true, email: true } },
    },
  });

  if (!request || request.clientId !== session.user.id) notFound();

  const quotation = request.quotations[0] ?? null;
  const previousVersions = request.quotations.slice(1);
  const ServiceIcon = SERVICE_ICONS[request.serviceType] ?? Package;

  let refImages: string[] = [];
  try {
    if (request.referenceImages) refImages = JSON.parse(request.referenceImages);
  } catch {}

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/client/requests"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Requests
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{request.productName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {request.id.slice(-10).toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(request.createdAt)}
              </span>
              {request.agent && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Agent: {request.agent.name}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Status timeline */}
      <Card className="border-0 shadow-elevation-1">
        <CardContent className="pt-6">
          <StatusTimeline current={request.status} />
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" /> Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Service Type</p>
              <div className="flex items-center gap-1.5 font-medium">
                <ServiceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {request.serviceType.replace(/_/g, " ")}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Quantity</p>
              <p className="font-medium">{request.quantity.toLocaleString()} units</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Target Unit Price</p>
              <p className="font-medium">
                {request.targetPrice ? formatCurrency(request.targetPrice) : <span className="text-muted-foreground">Not specified</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Destination</p>
              <div className="flex items-center gap-1.5 font-medium">
                {request.destinationCountry
                  ? <><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{request.destinationCountry}</>
                  : <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>
          </div>

          {request.description && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-line">{request.description}</p>
            </div>
          )}

          {request.notes && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
              <p className="text-sm whitespace-pre-line">{request.notes}</p>
            </div>
          )}

          {refImages.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Reference Images</p>
              <div className="space-y-1.5">
                {refImages.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotation */}
      {quotation ? (
        <Card className="border-0 border-t-4 border-t-accent shadow-elevation-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Quotation from Agent
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">v{quotation.version}</span>
                <StatusBadge status={quotation.status} size="sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Supplier */}
            {quotation.supplierLocation && (
              <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Supplier Location</p>
                <p className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3" />{quotation.supplierLocation}
                </p>
              </div>
            )}

            {/* Pricing — grid layout */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                  <p className="text-lg font-bold">{formatCurrency(quotation.unitPrice)}</p>
                </div>
                <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Qty × {request.quantity.toLocaleString()}</p>
                  <p className="text-lg font-bold">{formatCurrency(quotation.totalPrice)}</p>
                </div>
                {quotation.shippingCostEstimate != null && (
                  <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Truck className="h-3 w-3" />Shipping Est.</p>
                    <p className="text-lg font-bold">{formatCurrency(quotation.shippingCostEstimate)}</p>
                  </div>
                )}
                {quotation.serviceFee != null && quotation.serviceFee > 0 && (
                  <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Service Fee</p>
                    <p className="text-lg font-bold">{formatCurrency(quotation.serviceFee)}</p>
                  </div>
                )}
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
                  <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(quotation.totalPrice + (quotation.shippingCostEstimate ?? 0) + (quotation.serviceFee ?? 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Lead time + notes row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {quotation.estimatedLeadTime != null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-background border border-border px-4 py-3 flex-1">
                  <Clock className="h-4 w-4 shrink-0" />
                  Lead time: <span className="font-semibold text-foreground">{quotation.estimatedLeadTime} days</span>
                </div>
              )}
              {quotation.notes && (
                <div className="rounded-lg bg-background border border-border px-4 py-3 text-sm flex-[2]">
                  <p className="text-xs text-muted-foreground mb-1">Notes from agent</p>
                  <p className="whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}
            </div>

            {/* Revision note from client (shown when revision was requested) */}
            {quotation.revisionNote && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">Your Revision Request</p>
                <p className="text-orange-900 whitespace-pre-line">{quotation.revisionNote}</p>
              </div>
            )}

            {/* Action buttons — only shown for PENDING quotations */}
            {quotation.status === "PENDING" && (
              <div className="pt-2 border-t border-primary/20">
                <p className="text-sm font-medium text-foreground mb-3">Your response</p>
                <QuotationActions quotationId={quotation.id} status={quotation.status} />
              </div>
            )}

            {/* Non-pending status badge */}
            {quotation.status !== "PENDING" && (
              <div className="pt-2 border-t border-border">
                <QuotationActions quotationId={quotation.id} status={quotation.status} />
              </div>
            )}

          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-elevation-1">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">
              {request.status === "SUBMITTED"
                ? "Waiting for an agent to pick up your request"
                : request.status === "ASSIGNED"
                ? "Agent is preparing your quotation"
                : "Your request is being processed"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You&apos;ll see the full quotation here as soon as your agent submits it.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous quotation versions */}
      {previousVersions.length > 0 && (
        <Card className="border-0 shadow-elevation-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Previous Versions ({previousVersions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previousVersions.map((q) => (
              <div key={q.id} className="rounded-lg border border-border p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-muted rounded px-2 py-0.5">v{q.version}</span>
                    {q.supplierLocation && <span className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{q.supplierLocation}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</span>
                    <StatusBadge status={q.status} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Unit Price</p>
                    <p className="font-medium">{formatCurrency(q.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{formatCurrency(q.totalPrice)}</p>
                  </div>
                  {q.estimatedLeadTime != null && (
                    <div>
                      <p className="text-muted-foreground">Lead Time</p>
                      <p className="font-medium">{q.estimatedLeadTime} days</p>
                    </div>
                  )}
                </div>
                {q.revisionNote && (
                  <div className="rounded bg-orange-50 border border-orange-100 px-3 py-2">
                    <p className="text-xs font-semibold text-orange-700 mb-0.5">Your revision note</p>
                    <p className="text-xs text-orange-800 whitespace-pre-line">{q.revisionNote}</p>
                  </div>
                )}
                {q.notes && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">{q.notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
