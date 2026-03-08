import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that are publicly accessible without authentication
const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",       // NextAuth internal routes
];
const PUBLIC_EXACT = new Set(["/", "/auth/login", "/auth/register"]);

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
  const { pathname } = req.nextUrl;

  // Allow public paths through without any token check
  if (
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApi = pathname.startsWith("/api/");

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!token.emailVerified) {
    if (isApi) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/auth/verify-pending", req.url));
  }

  if (token.isActive === false) {
    if (isApi) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("error", "suspended");
    return NextResponse.redirect(url);
  }

  // Role enforcement: each portal segment requires the matching role
  for (const [prefix, requiredRole] of Object.entries(PORTAL_ROLES)) {
    if (pathname.startsWith(prefix)) {
      if (token.role !== requiredRole) {
        if (isApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const dest = ROLE_HOME[token.role as string] ?? "/auth/login";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|uploads/).*)"],
};
