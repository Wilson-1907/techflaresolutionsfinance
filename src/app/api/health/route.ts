import { NextResponse } from "next/server";
import { getFinanceApiKey, getMainSiteUrl } from "@/lib/env";

export async function GET() {
  const backendUrl = getMainSiteUrl();
  let backendReachable = false;
  let financeApiKeyValid = false;
  let financeApiKeyConfigured = Boolean(process.env.FINANCE_API_KEY?.trim());

  try {
    const health = await fetch(`${backendUrl}/api/health`, { cache: "no-store" });
    backendReachable = health.ok;
  } catch {
    backendReachable = false;
  }

  try {
    const res = await fetch(`${backendUrl}/api/finance/documents?type=invoice&nextNumber=true`, {
      headers: { "X-Finance-Api-Key": getFinanceApiKey() },
      cache: "no-store",
    });
    financeApiKeyValid = res.ok;
  } catch {
    financeApiKeyValid = false;
  }

  return NextResponse.json({
    status: "ok",
    app: "techflare-finance-panel",
    backendUrl,
    backendReachable,
    financeApiKeyConfigured,
    financeApiKeyValid,
    hint: !financeApiKeyValid
      ? "Set FINANCE_API_KEY on Vercel (finance panel) to the exact same value as FINANCE_API_KEY on Render. Set BACKEND_URL=https://techflaresolutionsback.onrender.com"
      : undefined,
  });
}
