import { NextResponse } from "next/server";
import { touchSession, SESSION_ABSOLUTE_SEC, SESSION_IDLE_SEC } from "@/lib/session";

export async function GET() {
  const payload = await touchSession();
  if (!payload) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const now = Date.now();
  return NextResponse.json({
    ok: true,
    issuedAt: payload.issuedAt,
    lastActivity: payload.lastActivity,
    absoluteExpiresAt: payload.issuedAt + SESSION_ABSOLUTE_SEC * 1000,
    idleExpiresAt: payload.lastActivity + SESSION_IDLE_SEC * 1000,
    serverTime: now,
  });
}
