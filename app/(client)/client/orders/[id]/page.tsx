import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, CreditCard, Banknote, Cog, Truck, PackageCheck,
  MapPin, Clock, Package, ArrowLeft, Download, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import PaymentUpload from "./PaymentUpload";
import ShippingMarkCard from "./ShippingMarkCard";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "CONFIRMED",       label: "Confirmed",       icon: ShieldCheck  },
  { key: "PAYMENT_PENDING", label: "Payment Pending", icon: CreditCard   },
  { key: "PAID",            label: "Paid",            icon: Banknote     },
  { key: "IN_PRODUCTION",   label: "In Production",   icon: Cog          },
  { key: "SHIPPED",         label: "Shipped",         icon: Truck        },
  { key: "DELIVERED",       label: "Delivered",       icon: PackageCheck },
] as const;

function getStageIndex(status: string) {
  return STAGES.findIndex((s) => s.key === status);
}

export default async function ClientOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) return null;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      request: { select: { productName: true, quantity: true, destinationCountry: true } },
      quotation: {
        select: {
          supplierLocation: true,
          unitPrice: true,
          totalPrice: true,
          estimatedLeadTime: true,
          shippingCostEstimate: true,
          agent: { select: { name: true, email: true } },
        },
      },
      // payment fields selected implicitly (all scalar fields fetched by default)
    },
  });

  if (!order || order.clientId !== session.user.id) notFound();

  const currentIdx = getStageIndex(order.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

      {/* Back link */}
      <Link
        href="/client/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">{order.request.productName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Summary */}
      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Product</p>
              <p className="font-semibold">{order.request.productName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
              <p className="font-semibold">{order.request.quantity.toLocaleString()} units</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
              <p className="font-semibold">{formatCurrency(order.quotation.unitPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Price</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(order.quotation.totalPrice)}</p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Supplier Location</p>
                <p className="font-semibold">{order.quotation.supplierLocation ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                <p className="font-semibold">
                  {order.quotation.estimatedLeadTime ? `${order.quotation.estimatedLeadTime} days` : "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Shipping Cost</p>
              <p className="font-semibold">
                {order.quotation.shippingCostEstimate
                  ? formatCurrency(order.quotation.shippingCostEstimate)
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: vertical stepper */}
          <div className="flex flex-col gap-0 sm:hidden">
            {STAGES.map((stage, idx) => {
              const isDone    = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all
                      ${isDone    ? "bg-primary border-primary text-primary-foreground" : ""}
                      ${isCurrent ? "bg-primary border-primary text-primary-foreground animate-pulse-ring" : ""}
                      ${idx > currentIdx ? "bg-background border-border text-muted-foreground" : ""}
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {idx < STAGES.length - 1 && <div className={`w-0.5 h-5 ${isDone ? "bg-primary" : "bg-border"}`} />}
                  </div>
                  <span className={`text-sm font-medium
                    ${isDone ? "text-primary" : isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}
                  `}>{stage.label}</span>
                </div>
              );
            })}
          </div>
          {/* Desktop: horizontal timeline */}
          <div className="hidden sm:block">
          <div className="relative flex items-start justify-between">
            {/* Connector line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border z-0" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-500"
              style={{ width: currentIdx > 0 ? `${(currentIdx / (STAGES.length - 1)) * (100 - (10 / STAGES.length))}%` : "0%" }}
            />

            {STAGES.map((stage, idx) => {
              const isDone    = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isUpcoming = idx > currentIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="relative z-10 flex flex-col items-center gap-2" style={{ width: `${100 / STAGES.length}%` }}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isDone    ? "bg-primary border-primary text-primary-foreground" : ""}
                    ${isCurrent ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110 animate-pulse-ring" : ""}
                    ${isUpcoming ? "bg-background border-border text-muted-foreground" : ""}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs text-center leading-tight font-medium
                    ${isDone ? "text-primary" : isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}
                  `}>{stage.label}</span>
                </div>
              );
            })}
          </div>
          </div>

          <p className="mt-4 sm:mt-6 text-center text-xs text-muted-foreground">
            Order placed on {formatDate(order.createdAt)}
            {order.quotation.agent.name && ` · Managed by ${order.quotation.agent.name}`}
          </p>
        </CardContent>
      </Card>

      {/* ── Payment Required card ── */}
      {order.status === "PAYMENT_PENDING" && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              Payment Required
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your order is confirmed. Please complete payment to start production.
            </p>
          </CardHeader>
          <CardContent>
            <PaymentUpload
              orderId={order.id}
              totalAmount={order.quotation.totalPrice}
              existingReceiptUrl={order.paymentReceiptUrl}
              rejectedReason={order.paymentRejectedReason}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Invoice download (when PAID) ── */}
      {order.status !== "PAYMENT_PENDING" && order.invoiceUrl && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Payment confirmed</p>
                  {order.paymentConfirmedAt && (
                    <p className="text-xs text-muted-foreground">{new Date(order.paymentConfirmedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <a
                href={order.invoiceUrl}
                download
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors w-full sm:w-auto"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Shipping Mark card (when mark exists) ── */}
      {order.shippingMarkRef && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Shipping Mark
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your shipping mark document has been prepared by your agent.
            </p>
          </CardHeader>
          <CardContent>
            <ShippingMarkCard
              orderId={order.id}
              markRef={order.shippingMarkRef}
              cartons={order.shippingMarkCartons}
              sentAt={order.shippingMarkSentAt}
            />
          </CardContent>
        </Card>
      )}

      {/* ── BOTTOM: Shipping Details (shown when SHIPPED or DELIVERED) ── */}
      {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" /> Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Carrier</p>
                <p className="font-semibold">{order.carrier ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                {order.trackingNumber ? (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(order.trackingNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    {order.trackingNumber}
                  </a>
                ) : (
                  <p className="font-semibold">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Est. Delivery</p>
                <p className="font-semibold">
                  {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Shipping Mark</p>
                <p className="font-mono font-semibold">{order.shippingMark ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
