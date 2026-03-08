import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validate-email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl  = rateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again in an hour." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "CLIENT",
      emailVerified: null,
      verificationToken: token,
      verificationTokenExpiry: expiry,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://ruya-platform-tau.vercel.app";
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await sendVerificationEmail(email.toLowerCase(), name.trim(), verificationLink);

  return NextResponse.json({ ok: true });
}
