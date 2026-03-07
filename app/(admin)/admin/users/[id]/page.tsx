import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Calendar, Shield,
  ClipboardList, FileText, ShoppingCart,
  CheckCircle2, Clock, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import DangerZone from "./DangerZone";
import ChangeRole from "./ChangeRole";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      sourcingRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, productName: true, status: true, createdAt: true },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, totalPrice: true, status: true, createdAt: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, createdAt: true, request: { select: { productName: true } } },
      },
      _count: {
        select: { sourcingRequests: true, quotations: true, orders: true },
      },
    },
  });

  if (!user) notFound();

  const roleBadge: Record<string, string> = {
    ADMIN:  "bg-red-100 text-red-800 border-red-200",
    AGENT:  "bg-purple-100 text-purple-800 border-purple-200",
    CLIENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{user.name ?? "No name"}</h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[user.role] ?? "bg-gray-100 text-gray-800 border-gray-200"}`}>
              {user.role}
            </span>
            {!user.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                SUSPENDED
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Joined {formatDate(user.createdAt)} · ID: {user.id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* ── Profile card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
              <p className="font-medium text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Shield className="h-3 w-3" /> Role</p>
              <p className="font-medium text-sm">{user.role}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Registered</p>
              <p className="font-medium text-sm">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account Status</p>
              {user.isActive ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-700">
                  Suspended
                </span>
              )}
            </div>
            {user.bannedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suspended on</p>
                <p className="font-medium text-sm">{formatDate(user.bannedAt)}</p>
              </div>
            )}
            {user.bannedReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suspension reason</p>
                <p className="font-medium text-sm text-red-700">{user.bannedReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Activity summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Sourcing Requests", value: user._count.sourcingRequests, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
          { label: "Quotations",        value: user._count.quotations,       icon: FileText,     color: "text-purple-600 bg-purple-50" },
          { label: "Orders",            value: user._count.orders,           icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recent activity timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.sourcingRequests.length === 0 && user.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {/* Recent requests */}
              {user.sourcingRequests.map((req: (typeof user.sourcingRequests)[0]) => (
                <div key={req.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Sourcing request: {req.productName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)} · {req.status.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))}
              {/* Recent orders */}
              {user.orders.map((order: (typeof user.orders)[0]) => (
                <div key={order.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Order #{order.id.slice(-8).toUpperCase()} — {order.request.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · {order.status.replace(/_/g, " ")}</p>
                  </div>
                  <Link href={`/admin/orders/${order.id}`} className="text-xs text-primary hover:underline shrink-0">View</Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Change role ── */}
      {user.role !== "ADMIN" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Change Role</CardTitle>
            <p className="text-sm text-muted-foreground">
              Switch between CLIENT and AGENT. Admin promotion requires terminal access.
            </p>
          </CardHeader>
          <CardContent>
            <ChangeRole userId={user.id} userName={user.name ?? user.email} currentRole={user.role} />
          </CardContent>
        </Card>
      )}

      {/* ── Danger zone ── */}
      {user.role !== "ADMIN" && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
            <p className="text-sm text-muted-foreground">
              Irreversible actions — proceed with caution.
            </p>
          </CardHeader>
          <CardContent>
            <DangerZone
              userId={user.id}
              userName={user.name ?? user.email}
              isActive={user.isActive}
              bannedReason={user.bannedReason}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
