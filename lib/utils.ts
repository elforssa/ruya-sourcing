import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    // SourcingRequest statuses
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    QUOTATION_SENT: "bg-purple-100 text-purple-800",
    VALIDATED: "bg-teal-100 text-teal-800",
    CONVERTED: "bg-green-100 text-green-800",
    // Quotation statuses
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REVISION_REQUESTED: "bg-orange-100 text-orange-800",
    REJECTED: "bg-red-100 text-red-800",
    // Order statuses
    CONFIRMED: "bg-teal-100 text-teal-800",
    PAYMENT_PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    IN_PRODUCTION: "bg-cyan-100 text-cyan-800",
    SHIPPED: "bg-violet-100 text-violet-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getStatusDotColor(status: string) {
  const dots: Record<string, string> = {
    DRAFT: "bg-gray-400",
    SUBMITTED: "bg-amber-500",
    ASSIGNED: "bg-blue-500",
    QUOTATION_SENT: "bg-purple-500",
    VALIDATED: "bg-teal-500",
    CONVERTED: "bg-green-500",
    PENDING: "bg-amber-500",
    ACCEPTED: "bg-green-500",
    REVISION_REQUESTED: "bg-orange-500",
    REJECTED: "bg-red-500",
    CONFIRMED: "bg-teal-500",
    PAYMENT_PENDING: "bg-amber-500",
    PAID: "bg-blue-500",
    IN_PRODUCTION: "bg-cyan-500",
    SHIPPED: "bg-violet-500",
    DELIVERED: "bg-emerald-500",
    CANCELLED: "bg-red-500",
  };
  return dots[status] ?? "bg-gray-400";
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
