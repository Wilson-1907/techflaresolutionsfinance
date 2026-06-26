import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { getPricedCatalog } from "@/lib/scope-generator";

/** Staff-only priced catalog — generated locally (no backend dependency). */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getPricedCatalog());
}
