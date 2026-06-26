import { getFinanceApiKey, getFinancePanelPassword, getMainSiteUrl } from "@/lib/env";

async function backendVerify(password: string): Promise<boolean> {
  const res = await fetch(`${getMainSiteUrl()}/api/panel-auth/finance/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Finance-Api-Key": getFinanceApiKey(),
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });
  return res.ok;
}

async function backendSeed(password: string): Promise<void> {
  await fetch(`${getMainSiteUrl()}/api/panel-auth/finance/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Finance-Api-Key": getFinanceApiKey(),
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function verifyFinanceLoginPassword(password: string): Promise<boolean> {
  try {
    if (await backendVerify(password)) return true;
  } catch {
    /* backend unreachable */
  }

  if (password === getFinancePanelPassword()) {
    await backendSeed(password);
    return true;
  }

  return false;
}
