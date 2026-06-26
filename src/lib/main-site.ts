import { getFinanceApiKey, getMainSiteUrl } from "@/lib/env";

export class MainSiteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function mainSiteFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("X-Finance-Api-Key", getFinanceApiKey());
  headers.set("User-Agent", "TechFlare-FinancePanel/1.0");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getMainSiteUrl()}${path}`, { ...options, headers, cache: "no-store" });
  const raw = await res.text();
  let data: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new MainSiteError(
        res.ok
          ? "Backend returned invalid JSON"
          : `Backend error (${res.status}) — check BACKEND_URL points to Render API`,
        res.status || 502
      );
    }
  }
  if (!res.ok) {
    const msg =
      res.status === 401
        ? "Invalid finance API key — FINANCE_API_KEY on this panel must match Render backend. BACKEND_URL=https://techflaresolutionsback.onrender.com"
        : (data.error as string) || "Main site request failed";
    throw new MainSiteError(msg, res.status);
  }
  return data;
}
