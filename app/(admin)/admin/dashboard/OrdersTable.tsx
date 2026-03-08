"use client";

import { useState } from "react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ALL_STATUSES = [
  "ALL",
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
];

const SHIPPING_MARK_FILTERS = [
  { value: "ALL_MARKS",   label: "All Mark Status" },
  { value: "HAS_MARK",    label: "Has Shipping Mark" },
  { value: "NO_MARK",     label: "No Shipping Mark" },
  { value: "MARK_SENT",   label: "Mark Sent to Supplier" },
];

interface Order {
  id: string;
  createdAt: Date;
  status: string;
  shippingMarkRef: string | null;
  shippingMarkSentAt: Date | null;
  request: { productName: string };
  client: { name: string | null };
  quotation: {
    totalPrice: number;
    supplierName: string | null;
    agent: { name: string | null };
  };
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [filter,     setFilter]     = useState("ALL");
  const [markFilter, setMarkFilter] = useState("ALL_MARKS");

  const filtered = orders
    .filter((o) => filter === "ALL" || o.status === filter)
    .filter((o) => {
      if (markFilter === "HAS_MARK")  return !!o.shippingMarkRef;
      if (markFilter === "NO_MARK")   return !o.shippingMarkRef;
      if (markFilter === "MARK_SENT") return !!o.shippingMarkSentAt;
      return true;
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={markFilter}
            onChange={(e) => setMarkFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SHIPPING_MARK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No orders match this filter.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.request.productName}</p>
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Client: {order.client.name ?? "—"}</span>
                  <span>Agent: {order.quotation.agent.name ?? "—"}</span>
                  <span>Supplier: {order.quotation.supplierName ?? "—"}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.quotation.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shipping Mark</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium">{order.request.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.client.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.quotation.agent.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.quotation.supplierName ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.quotation.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.shippingMarkRef ? <span className="font-mono text-xs text-primary">{order.shippingMarkRef}</span> : <span className="text-xs text-muted-foreground">—</span>}
                      {order.shippingMarkSentAt && <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Sent</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
