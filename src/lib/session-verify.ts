import { getFinancePanelSecret } from "@/lib/env";
import {
  formatSessionPayload,
  isSessionExpired,
  parseSessionRaw,
  type SessionPayload,
} from "@/lib/session-policy";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signPayload(payloadStr: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
  return bufferToHex(signed);
}

/** Edge-safe session verification for middleware (Web Crypto, not Node crypto). */
export async function verifySessionCookie(raw: string | undefined): Promise<SessionPayload | null> {
  const parsed = parseSessionRaw(raw);
  if (!parsed) return null;

  let secret: string;
  try {
    secret = getFinancePanelSecret();
  } catch {
    return null;
  }

  const payloadStr = formatSessionPayload(
    parsed.payload.token,
    parsed.payload.issuedAt,
    parsed.payload.lastActivity
  );
  const expected = await signPayload(payloadStr, secret);
  if (expected !== parsed.signature) return null;
  if (isSessionExpired(parsed.payload)) return null;
  return parsed.payload;
}

export async function encodeSessionCookie(token: string, issuedAt: number, lastActivity: number) {
  const secret = getFinancePanelSecret();
  const payloadStr = formatSessionPayload(token, issuedAt, lastActivity);
  const signature = await signPayload(payloadStr, secret);
  return `${payloadStr}.${signature}`;
}
