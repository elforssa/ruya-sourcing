import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck, CreditCard, Banknote, Cog, Truck, PackageCheck,
  MapPin, Clock, Package, ArrowLeft, User,
} from "lucide-react";
import Link from "next/link";
import OrderStatusForm from "./OrderStatusForm";
import ShippingMarkSection from "./ShippingMarkSection";

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

export default async function AgentOrderDetailPage({
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
      client: { select: { name: true, email: true } },
      quotation: {
        select: {
          agentId: true,
          supplierName: true,
          supplierLocation: true,
          unitPrice: true,
          totalPrice: true,
          estimatedLeadTime: true,
          shippingCostEstimate: true,
        },
      },
    },
  });

  if (!order || order.quotation.agentId !== session.user.id) notFound();

  const currentIdx = getStageIndex(order.status);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* Back link */}
      <Link
        href="/agent/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">{order.request.productName}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* ── TOP: Order Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

          <div className="mt-5 pt-5 border-t grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Supplier</p>
              <p className="font-semibold">{order.quotation.supplierName ?? "—"}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
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

          {/* Client info */}
          <div className="mt-5 pt-5 border-t flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-semibold text-sm">{order.client.name}</p>
              <p className="text-xs text-muted-foreground">{order.client.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MIDDLE: Status Timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-start justify-between">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border z-0" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
              style={{ width: currentIdx > 0 ? `${(currentIdx / (STAGES.length - 1)) * (100 - (10 / STAGES.length))}%` : "0%" }}
            />

            {STAGES.map((stage, idx) => {
              const isDone    = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isUpcoming = idx > currentIdx;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="relative z-10 flex flex-col items-center gap-2" style={{ width: `${100 / STAGES.length}%` }}>
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${isDone    ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                      ${isCurrent ? "bg-[#c9a84c] border-[#c9a84c] text-white shadow-lg scale-110" : ""}
                      ${isUpcoming ? "bg-background border-border text-muted-foreground" : ""}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs text-center leading-tight font-medium
                    ${isDone    ? "text-emerald-600" : ""}
                    ${isCurrent ? "text-[#c9a84c]" : ""}
                    ${isUpcoming ? "text-muted-foreground" : ""}
                  `}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Order placed on {formatDate(order.createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* ── Shipping Mark (shown from IN_PRODUCTION onwards) ── */}
      {["IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(order.status) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cog className="h-4 w-4 text-primary" /> Shipping Mark
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Prepare and send the shipping mark document to the factory.
            </p>
          </CardHeader>
          <CardContent>
            <ShippingMarkSection
              orderId={order.id}
              initial={{
                ref:         order.shippingMarkRef,
                cartons:     order.shippingMarkCartons,
                netWeight:   order.shippingMarkNetWeight,
                grossWeight: order.shippingMarkGrossWeight,
                dimensions:  order.shippingMarkDimensions,
                notes:       order.shippingMarkNotes,
                sentAt:      order.shippingMarkSentAt,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* ── BOTTOM: Update Order Status ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Update Order
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Change the status and add shipping details when the order ships.
          </p>
        </CardHeader>
        <CardContent>
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentCarrier={order.carrier}
            currentTracking={order.trackingNumber}
            currentDelivery={order.estimatedDelivery?.toISOString() ?? null}
            currentShippingMark={order.shippingMark}
          />
        </CardContent>
      </Card>
    </div>
  );
}
