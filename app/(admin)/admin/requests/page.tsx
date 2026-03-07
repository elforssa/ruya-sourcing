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
    <div className="p-8 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Requests</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide sourcing requests — assign agents with live workload visibility.
        </p>
      </div>

      <Card>
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
