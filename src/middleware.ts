import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encodeSessionCookie, verifySessionCookie } from "@/lib/session-verify";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/session";

async function attachRefreshedSession(response: NextResponse, payload: { token: string; issuedAt: number }) {
  const now = Date.now();
  const value = await encodeSessionCookie(payload.token, payload.issuedAt, now);
  response.cookies.set(getSessionCookieName(), value, getSessionCookieOptions(payload.issuedAt));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login" || pathname === "/api/health") {
    return NextResponse.next();
  }

  const session = req.cookies.get(getSessionCookieName())?.value;
  const payload = await verifySessionCookie(session);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("reason", "expired");
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  await attachRefreshedSession(response, payload);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
