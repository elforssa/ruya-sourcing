/**
 * Deletes demo accounts and all their associated data.
 *
 * Usage:
 *   npx tsx scripts/delete-demo-users.ts
 *
 * Or with an explicit DATABASE_URL:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/delete-demo-users.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAILS = ["admin@ruya.com", "agent@ruya.com", "client@ruya.com"];

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true },
  });

  if (!users.length) {
    console.log("\n  ✓ No demo accounts found. Nothing to delete.\n");
    return;
  }

  const ids = users.map((u) => u.id);
  console.log("\n  Found:", users.map((u) => u.email).join(", "));

  // 1. Delete orders (reference both clientId and quotationId → agentId)
  const o = await prisma.order.deleteMany({
    where: {
      OR: [
        { clientId: { in: ids } },
        { quotation: { agentId: { in: ids } } },
      ],
    },
  });
  console.log("  Orders deleted:          ", o.count);

  // 2. Delete quotations (reference agentId)
  const q = await prisma.quotation.deleteMany({
    where: { agentId: { in: ids } },
  });
  console.log("  Quotations deleted:      ", q.count);

  // 3. Unassign demo agents, then delete their sourcing requests
  await prisma.sourcingRequest.updateMany({
    where: { assignedAgentId: { in: ids } },
    data: { assignedAgentId: null },
  });
  const r = await prisma.sourcingRequest.deleteMany({
    where: { clientId: { in: ids } },
  });
  console.log("  Sourcing requests deleted:", r.count);

  // 4. Delete users (Notifications, Accounts, Sessions cascade automatically)
  const u = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log("  Users deleted:           ", u.count);

  console.log("\n  ✅ Done — all demo data removed.\n");
}

main()
  .catch((err) => {
    console.error("\n  Error:", err.message, "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
