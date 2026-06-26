import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { mainSiteFetch } from "@/lib/main-site";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  const direction = req.nextUrl.searchParams.get("direction");
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (direction) params.set("direction", direction);
  const qs = params.toString();
  const data = await mainSiteFetch(`/api/finance/ledger${qs ? `?${qs}` : ""}`);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.text();
  try {
    const data = await mainSiteFetch("/api/finance/ledger", { method: "POST", body });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
