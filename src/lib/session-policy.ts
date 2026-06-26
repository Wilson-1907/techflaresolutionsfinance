/** Max time logged in after sign-in (seconds). */
export const SESSION_ABSOLUTE_SEC = 30 * 60;

/** Log out after this much inactivity (seconds). */
export const SESSION_IDLE_SEC = 10 * 60;

export type SessionPayload = {
  token: string;
  issuedAt: number;
  lastActivity: number;
};

export function formatSessionPayload(token: string, issuedAt: number, lastActivity: number) {
  return `${token}.${issuedAt}.${lastActivity}`;
}

export function parseSessionRaw(raw: string | undefined): { payload: SessionPayload; signature: string } | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [token, issuedAtStr, lastActivityStr, signature] = parts;
  const issuedAt = Number(issuedAtStr);
  const lastActivity = Number(lastActivityStr);
  if (!token || !signature || !Number.isFinite(issuedAt) || !Number.isFinite(lastActivity)) {
    return null;
  }
  return { payload: { token, issuedAt, lastActivity }, signature };
}

export function isSessionExpired(payload: SessionPayload, now = Date.now()): boolean {
  if (now - payload.issuedAt > SESSION_ABSOLUTE_SEC * 1000) return true;
  if (now - payload.lastActivity > SESSION_IDLE_SEC * 1000) return true;
  return false;
}

export function sessionMaxAgeSeconds(issuedAt: number, now = Date.now()) {
  return Math.max(1, SESSION_ABSOLUTE_SEC - Math.floor((now - issuedAt) / 1000));
}
