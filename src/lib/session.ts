import crypto from "crypto";
import { cookies } from "next/headers";
import { getFinancePanelSecret, isProduction } from "@/lib/env";
import {
  formatSessionPayload,
  isSessionExpired,
  parseSessionRaw,
  sessionMaxAgeSeconds,
  SESSION_ABSOLUTE_SEC,
  SESSION_IDLE_SEC,
  type SessionPayload,
} from "@/lib/session-policy";

const COOKIE = "tf_finance_session";

function sign(value: string) {
  return crypto.createHmac("sha256", getFinancePanelSecret()).update(value).digest("hex");
}

function encodeSession(token: string, issuedAt: number, lastActivity: number) {
  const payload = formatSessionPayload(token, issuedAt, lastActivity);
  return `${payload}.${sign(payload)}`;
}

function cookieOptions(issuedAt: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionMaxAgeSeconds(issuedAt),
  };
}

function verifyAndParse(raw: string | undefined): SessionPayload | null {
  const parsed = parseSessionRaw(raw);
  if (!parsed) return null;
  const payloadStr = formatSessionPayload(
    parsed.payload.token,
    parsed.payload.issuedAt,
    parsed.payload.lastActivity
  );
  if (sign(payloadStr) !== parsed.signature) return null;
  if (isSessionExpired(parsed.payload)) return null;
  return parsed.payload;
}

export function verifySessionValue(raw: string | undefined): boolean {
  return verifyAndParse(raw) !== null;
}

export async function createSession() {
  const now = Date.now();
  const token = crypto.randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(COOKIE, encodeSession(token, now, now), cookieOptions(now));
}

export async function touchSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const payload = verifyAndParse(store.get(COOKIE)?.value);
  if (!payload) return null;
  const now = Date.now();
  store.set(COOKIE, encodeSession(payload.token, payload.issuedAt, now), cookieOptions(payload.issuedAt));
  return { ...payload, lastActivity: now };
}

export async function isAuthenticated() {
  const store = await cookies();
  return verifyAndParse(store.get(COOKIE)?.value) !== null;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export function getSessionCookieName() {
  return COOKIE;
}

export function getSessionCookieOptions(issuedAt: number) {
  return cookieOptions(issuedAt);
}

export function encodeSessionCookie(token: string, issuedAt: number, lastActivity: number) {
  return encodeSession(token, issuedAt, lastActivity);
}

export { SESSION_ABSOLUTE_SEC, SESSION_IDLE_SEC };
