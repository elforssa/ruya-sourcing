import { getStatusColor } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  ASSIGNED: "Assigned",
  QUOTATION_SENT: "Quotation Sent",
  VALIDATED: "Validated",
  CONVERTED: "Converted",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVISION_REQUESTED: "Revision Requested",
  REJECTED: "Rejected",
  CONFIRMED: "Confirmed",
  PAYMENT_PENDING: "Payment Pending",
  PAID: "Paid",
  IN_PRODUCTION: "In Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

type Size = "sm" | "md";

export function StatusBadge({ status, size = "md" }: { status: string; size?: Size }) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  const color = getStatusColor(status);
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${color}`}>
      {label}
    </span>
  );
}
