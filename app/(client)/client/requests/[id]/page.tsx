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
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
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
      quotations: {
        orderBy: { version: "desc" },
        take: 1,
      },
      agent: { select: { name: true, email: true } },
    },
  });

  if (!request || request.clientId !== session.user.id) notFound();

  const quotation = request.quotations[0] ?? null;
  const ServiceIcon = SERVICE_ICONS[request.serviceType] ?? Package;

  let refImages: string[] = [];
  try {
    if (request.referenceImages) refImages = JSON.parse(request.referenceImages);
  } catch {}

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

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
          <span
            className={`inline-flex items-center self-start rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(request.status)}`}
          >
            {request.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      <Card>
        <CardContent className="pt-6">
          <StatusTimeline current={request.status} />
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Request Details (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" /> Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Key fields grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
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

              {/* Description */}
              {request.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-line">{request.description}</p>
                </div>
              )}

              {/* Notes */}
              {request.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-sm whitespace-pre-line">{request.notes}</p>
                </div>
              )}

              {/* Reference images */}
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
        </div>

        {/* Right: Quotation (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {quotation ? (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" /> Quotation
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">v{quotation.version}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                      {quotation.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Supplier */}
                {(quotation.supplierName || quotation.supplierLocation) && (
                  <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Supplier</p>
                    {quotation.supplierName && <p className="font-semibold">{quotation.supplierName}</p>}
                    {quotation.supplierLocation && (
                      <p className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />{quotation.supplierLocation}
                      </p>
                    )}
                  </div>
                )}

                {/* Pricing breakdown */}
                <div className="space-y-2.5 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing Breakdown</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-semibold">{formatCurrency(quotation.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qty × {request.quantity.toLocaleString()}</span>
                    <span className="font-semibold">{formatCurrency(quotation.totalPrice)}</span>
                  </div>
                  {quotation.shippingCostEstimate != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> Shipping Est.
                      </span>
                      <span className="font-semibold">{formatCurrency(quotation.shippingCostEstimate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total Est. Cost</span>
                    <span className="font-bold text-base">
                      {formatCurrency(quotation.totalPrice + (quotation.shippingCostEstimate ?? 0))}
                    </span>
                  </div>
                </div>

                {/* Lead time */}
                {quotation.estimatedLeadTime != null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                    <Clock className="h-4 w-4" />
                    Lead time: <span className="font-medium text-foreground">{quotation.estimatedLeadTime} days</span>
                  </div>
                )}

                {/* Quotation notes */}
                {quotation.notes && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Notes from agent</p>
                    <p className="text-muted-foreground whitespace-pre-line">{quotation.notes}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 border-t border-border">
                  <QuotationActions quotationId={quotation.id} status={quotation.status} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Awaiting Quotation</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-48">
                  An agent will review your request and send a quotation shortly.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
