import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PORTAL_ROLES: Record<string, string> = {
  "/admin":  "ADMIN",
  "/agent":  "AGENT",
  "/client": "CLIENT",
};

const ROLE_HOME: Record<string, string> = {
  ADMIN:  "/admin/dashboard",
  AGENT:  "/agent/dashboard",
  CLIENT: "/client/dashboard",
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!token.emailVerified) {
    return NextResponse.redirect(new URL("/auth/verify-pending", req.url));
  }

  if (token.isActive === false) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("error", "suspended");
    return NextResponse.redirect(url);
  }

  // Role enforcement: each portal segment requires the matching role
  for (const [prefix, requiredRole] of Object.entries(PORTAL_ROLES)) {
    if (pathname.startsWith(prefix)) {
      if (token.role !== requiredRole) {
        const dest = ROLE_HOME[token.role as string] ?? "/auth/login";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/agent/:path*", "/admin/:path*"],
};
