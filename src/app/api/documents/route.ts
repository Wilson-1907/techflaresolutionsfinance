import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { mainSiteFetch } from "@/lib/main-site";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  const nextNumber = req.nextUrl.searchParams.get("nextNumber");
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (nextNumber) params.set("nextNumber", nextNumber);
  else params.set("all", "true");
  const qs = params.toString();
  const data = await mainSiteFetch(`/api/finance/documents?${qs}`);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const data = await mainSiteFetch("/api/finance/documents", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create document";
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
