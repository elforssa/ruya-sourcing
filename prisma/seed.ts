import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed script must not run in production! Set NODE_ENV to development.");
  }

  console.log("🌱 Seeding database...");

  await prisma.order.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.sourcingRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ruya.com",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const agent = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "agent@ruya.com",
      password: hashedPassword,
      role: "AGENT",
      emailVerified: new Date(),
    },
  });

  const client = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "client@ruya.com",
      password: hashedPassword,
      role: "CLIENT",
      emailVerified: new Date(),
    },
  });

  const request1 = await prisma.sourcingRequest.create({
    data: {
      productName: "Custom Bluetooth Earbuds",
      description: "Bluetooth 5.0 earbuds with ANC, minimum 8hr battery life, IPX4 rating. Custom branding required.",
      quantity: 500,
      targetPrice: 18.5,
      destinationCountry: "United States",
      serviceType: "FULL_SOURCING",
      status: "QUOTATION_SENT",
      clientId: client.id,
      assignedAgentId: agent.id,
    },
  });

  const request2 = await prisma.sourcingRequest.create({
    data: {
      productName: "Eco-Friendly Tote Bags",
      description: "Organic cotton tote bags with custom screen printing. 15x16 inch, natural color with black logo.",
      quantity: 1000,
      targetPrice: 4.0,
      destinationCountry: "France",
      serviceType: "FULL_SOURCING",
      status: "ASSIGNED",
      clientId: client.id,
      assignedAgentId: agent.id,
    },
  });

  const request3 = await prisma.sourcingRequest.create({
    data: {
      productName: "Stainless Steel Water Bottles",
      description: "Double-wall vacuum insulated 500ml water bottles with custom lid design and laser engraving.",
      quantity: 250,
      targetPrice: 12.0,
      destinationCountry: "Germany",
      serviceType: "PRICE_CHECK",
      status: "SUBMITTED",
      clientId: client.id,
    },
  });

  const quotation = await prisma.quotation.create({
    data: {
      unitPrice: 16.8,
      totalPrice: 8400,
      supplierLocation: "Shenzhen, China",
      estimatedLeadTime: 25,
      shippingCostEstimate: 320,
      notes: "Price includes custom packaging and branding. MOQ 500 units. Sample available in 5 business days.",
      status: "PENDING",
      version: 1,
      requestId: request1.id,
      agentId: agent.id,
    },
  });

  await prisma.order.create({
    data: {
      status: "IN_PRODUCTION",
      shippingMark: "RUYA / NYC / 001",
      carrier: "DHL Express",
      requestId: request1.id,
      quotationId: quotation.id,
      clientId: client.id,
    },
  });

  console.log("✅ Seed complete!");
  console.log("\n📋 Test accounts:");
  console.log("  Admin  → admin@ruya.com  / password123");
  console.log("  Agent  → agent@ruya.com  / password123");
  console.log("  Client → client@ruya.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
