const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const DEFAULT_BACKEND_URL = "https://techflaresolutionsback.onrender.com";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getMainSiteUrl(): string {
  const url =
    process.env.BACKEND_URL?.trim() ||
    process.env.MAIN_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_MAIN_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production" && !isBuild && !isBrowser()) {
    throw new Error("BACKEND_URL or MAIN_SITE_URL is required in production (server).");
  }
  return DEFAULT_BACKEND_URL;
}

export function getFinancePanelSecret(): string {
  const secret = process.env.FINANCE_PANEL_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && !isBuild) {
    throw new Error("FINANCE_PANEL_SECRET is required in production.");
  }
  return "dev-finance-panel-secret";
}

export function getFinancePanelPassword(): string {
  const password = process.env.FINANCE_PANEL_PASSWORD?.trim();
  if (password) return password;
  if (process.env.NODE_ENV === "production" && !isBuild) {
    throw new Error("FINANCE_PANEL_PASSWORD is required in production.");
  }
  return "finance123";
}

export function getFinanceApiKey(): string {
  const key = process.env.FINANCE_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (key) return key;
  if (process.env.NODE_ENV === "production" && !isBuild) {
    throw new Error("FINANCE_API_KEY is required in production.");
  }
  return "dev-finance-api-key";
}

/** Public main website (for M-Pesa pay links), not the backend API URL */
export function getMainFrontendUrl(): string {
  const url =
    process.env.MAIN_FRONTEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_MAIN_FRONTEND_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return "https://techflaresolutionss.vercel.app";
  return "http://localhost:3000";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
