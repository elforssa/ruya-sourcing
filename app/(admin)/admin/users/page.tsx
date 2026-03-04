import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { sourcingRequests: true, orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">All registered platform users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{user._count.sourcingRequests} requests</span>
                  <span>{user._count.orders} orders</span>
                  <span>{formatDate(user.createdAt)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                    user.role === "AGENT" ? "bg-purple-100 text-purple-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
