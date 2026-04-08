import { getStatusColor, getStatusDotColor } from "@/lib/utils";

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
  const dotColor = getStatusDotColor(status);
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}
