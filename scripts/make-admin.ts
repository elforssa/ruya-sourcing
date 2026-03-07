/**
 * Admin promotion script.
 *
 * Usage:
 *   npx ts-node scripts/make-admin.ts email@example.com
 *
 * Requires DATABASE_URL to be set (loads from .env automatically).
 * Only run this from a machine with direct database access.
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("\n  Error: Email argument is required.");
    console.error("  Usage: npx ts-node scripts/make-admin.ts email@example.com\n");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`\n  Error: No user found with email "${email}".\n`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`\n  ✓ ${user.name ?? user.email} is already an ADMIN. No changes made.\n`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`\n  ✅ Success!`);
  console.log(`     Name:  ${user.name ?? "(no name)"}`);
  console.log(`     Email: ${user.email}`);
  console.log(`     Role:  ${user.role} → ADMIN\n`);
}

main()
  .catch((err) => {
    console.error("\n  Script failed:", err.message, "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
