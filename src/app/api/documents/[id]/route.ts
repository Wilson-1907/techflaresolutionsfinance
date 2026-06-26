import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { mainSiteFetch, MainSiteError } from "@/lib/main-site";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const data = await mainSiteFetch(`/api/finance/documents/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof MainSiteError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Failed to load document";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data = await mainSiteFetch(`/api/finance/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await mainSiteFetch(`/api/finance/documents/${id}`, { method: "DELETE" });
  return NextResponse.json(data);
}
