import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validate-email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl  = rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { email } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user) {
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://ruya-platform-tau.vercel.app";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.name ?? "User", resetLink);
  }

  return NextResponse.json({ ok: true });
}
