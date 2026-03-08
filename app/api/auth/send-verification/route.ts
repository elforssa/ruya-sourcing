import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`verify:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const session = await getServerSession(authOptions);

  let user;
  if (session?.user?.id) {
    user = await prisma.user.findUnique({ where: { id: session.user.id } });
  } else {
    const body = await req.json().catch(() => ({}));
    const email = body?.email as string | undefined;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  if (!user) {
    return NextResponse.json({ ok: true });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: token, verificationTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://ruya-platform-tau.vercel.app";
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await sendVerificationEmail(user.email, user.name ?? "User", verificationLink);

  return NextResponse.json({ ok: true });
}
