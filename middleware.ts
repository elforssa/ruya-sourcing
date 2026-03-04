import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/agent/:path*", "/admin/:path*"],
};
