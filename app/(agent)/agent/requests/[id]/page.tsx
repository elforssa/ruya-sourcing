import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, MapPin, Package, Hash, Calendar,
  Globe, Tag, Search, Clock, DollarSign, User,
  FileText, ChevronDown,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import QuotationForm from "./QuotationForm";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  FULL_SOURCING: Globe,
  PRICE_CHECK: Tag,
  INSPECTION: Search,
};

export default async function AgentRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) return null;

  const request = await prisma.sourcingRequest.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { name: true, email: true } },
      quotations: { orderBy: { version: "desc" } },
    },
  });

  if (!request || request.assignedAgentId !== session.user.id) notFound();

  const latestQuotation = request.quotations[0] ?? null;
  const previousVersions = request.quotations.slice(1);

  const isRevision = latestQuotation?.status === "REVISION_REQUESTED";
  const canSubmitForm =
    !latestQuotation || isRevision;

  const ServiceIcon = SERVICE_ICONS[request.serviceType] ?? Package;

  let refImages: string[] = [];
  try {
    if (request.referenceImages) refImages = JSON.parse(request.referenceImages);
  } catch {}

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/agent/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{request.productName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />{request.id.slice(-10).toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />{formatDate(request.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />Client: {request.client.name}
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center self-start rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(request.status)}`}>
            {request.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Request Details (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" /> Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Service Type</p>
                  <div className="flex items-center gap-1 font-medium">
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
                    {request.targetPrice
                      ? formatCurrency(request.targetPrice)
                      : <span className="text-muted-foreground">Not specified</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Destination</p>
                  {request.destinationCountry ? (
                    <div className="flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {request.destinationCountry}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </div>
              </div>

              {request.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{request.description}</p>
                </div>
              )}

              {request.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Client Notes</p>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{request.notes}</p>
                </div>
              )}

              {refImages.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Reference Images</p>
                  <div className="space-y-1">
                    {refImages.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                      >
                        <FileText className="h-3 w-3 shrink-0" />{url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Client info */}
              <div className="pt-3 border-t border-border rounded-lg bg-muted/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{request.client.name}</p>
                <p className="text-xs text-muted-foreground">{request.client.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Quotation area (3/5) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Active quotation (submitted, not revision) */}
          {latestQuotation && !isRevision && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Current Quotation <span className="text-muted-foreground font-normal">v{latestQuotation.version}</span>
                  </CardTitle>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(latestQuotation.status)}`}>
                    {latestQuotation.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {latestQuotation.supplierLocation && (
                  <div className="rounded-lg bg-muted/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">Supplier Location</p>
                    <p className="flex items-center gap-1 text-muted-foreground text-xs">
                      <MapPin className="h-3 w-3" />{latestQuotation.supplierLocation}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-semibold">{formatCurrency(latestQuotation.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total ({request.quantity.toLocaleString()} units)</span>
                    <span className="font-semibold">{formatCurrency(latestQuotation.totalPrice)}</span>
                  </div>
                  {latestQuotation.shippingCostEstimate != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping Estimate</span>
                      <span className="font-semibold">{formatCurrency(latestQuotation.shippingCostEstimate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total Estimate</span>
                    <span className="font-bold">
                      {formatCurrency(latestQuotation.totalPrice + (latestQuotation.shippingCostEstimate ?? 0))}
                    </span>
                  </div>
                </div>
                {latestQuotation.estimatedLeadTime != null && (
                  <div className="flex items-center gap-2 text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                    <Clock className="h-4 w-4" />
                    Lead time: <span className="font-medium text-foreground">{latestQuotation.estimatedLeadTime} days</span>
                  </div>
                )}
                {latestQuotation.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-muted-foreground whitespace-pre-line">{latestQuotation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quotation form */}
          {/* Revision banner — shown above form when client requested changes */}
          {isRevision && latestQuotation?.revisionNote && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">Client Requested a Revision</p>
              <p className="text-sm text-amber-900 whitespace-pre-line">{latestQuotation.revisionNote}</p>
            </div>
          )}

          {canSubmitForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {isRevision ? `Submit Revised Quotation (v${(latestQuotation?.version ?? 0) + 1})` : "Submit Quotation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuotationForm
                  requestId={params.id}
                  quantity={request.quantity}
                  prefill={isRevision ? {
                    supplierLocation: latestQuotation?.supplierLocation ?? null,
                    unitPrice: latestQuotation?.unitPrice ?? 0,
                    estimatedLeadTime: latestQuotation?.estimatedLeadTime ?? null,
                    shippingCostEstimate: latestQuotation?.shippingCostEstimate ?? null,
                    notes: null,
                  } : null}
                  isRevision={isRevision}
                />
              </CardContent>
            </Card>
          )}

          {/* Previous quotation versions */}
          {previousVersions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  Previous Versions ({previousVersions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previousVersions.map((q) => (
                  <div key={q.id} className="rounded-lg border border-border p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-muted rounded px-2 py-0.5">v{q.version}</span>
                        {q.supplierLocation && <span className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{q.supplierLocation}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(q.status)}`}>
                          {q.status.replace(/_/g, " ")}
                        </span>
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
                    {q.notes && (
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">{q.notes}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
