import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { getFinanceApiKey, getMainSiteUrl } from "@/lib/env";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitLogin(req: NextRequest): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return null;
  }

  entry.count += 1;
  if (entry.count > 10) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }
  return null;
}

async function backendPanelAuth(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${getMainSiteUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Finance-Api-Key": getFinanceApiKey(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function backendOtp(body: Record<string, unknown>) {
  const otp = await backendPanelAuth("/api/panel-auth/finance/login-otp", body);
  if (otp.res.status !== 404) return otp;

  if (body.challengeId != null) {
    return {
      res: otp.res,
      data: { error: "Email verification is unavailable. Try signing in with your password again." },
    };
  }

  return backendPanelAuth("/api/panel-auth/finance/verify", { password: body.password });
}

export async function POST(req: NextRequest) {
  const limited = rateLimitLogin(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { res, data } = await backendOtp(body);

    if (!res.ok) {
      const message = (data.error as string) || "Invalid password";
      const status = res.status === 404 ? 503 : res.status;
      return NextResponse.json({ error: message }, { status });
    }

    if (data.requiresOtp) {
      return NextResponse.json({
        requiresOtp: true,
        challengeId: data.challengeId,
        emailHint: data.emailHint,
      });
    }

    if (data.ok) {
      await createSession();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unexpected response" }, { status: 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
