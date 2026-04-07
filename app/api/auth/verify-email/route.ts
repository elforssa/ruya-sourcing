import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=missing-token", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  // Use a generic error for both invalid and expired tokens to prevent enumeration
  if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-token", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
}
