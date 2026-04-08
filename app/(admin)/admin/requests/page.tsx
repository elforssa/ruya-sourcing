import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequestsTable from "../dashboard/RequestsTable";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;

  const [requests, agents] = await Promise.all([
    prisma.sourcingRequest.findMany({
      include: {
        client: { select: { name: true } },
        agent:  { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where:   { role: "AGENT", isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-screen-xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">All Requests</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide sourcing requests — assign agents with live workload visibility.
        </p>
      </div>

      <Card className="border-0 shadow-elevation-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sourcing Requests ({requests.length})</CardTitle>
          <p className="text-sm text-muted-foreground">
            The agent picker shows live workload — sorted least busy first.
          </p>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={requests} agents={agents} />
        </CardContent>
      </Card>
    </div>
  );
}
