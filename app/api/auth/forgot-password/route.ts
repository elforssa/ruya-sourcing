import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validate-email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl  = await rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
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
    const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
    const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour (matches expiry below)
    if (
      user.resetTokenExpiry &&
      user.resetTokenExpiry.getTime() > Date.now() + (TOKEN_TTL_MS - COOLDOWN_MS)
    ) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + TOKEN_TTL_MS);

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
