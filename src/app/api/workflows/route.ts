import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session";

import { mainSiteFetch, MainSiteError } from "@/lib/main-site";



export async function GET(req: NextRequest) {

  if (!(await isAuthenticated())) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }

  try {

    const status = req.nextUrl.searchParams.get("status");

    const id = req.nextUrl.searchParams.get("id");

    const params = new URLSearchParams();

    if (status) params.set("status", status);

    if (id) params.set("id", id);

    if (req.nextUrl.searchParams.get("emailPreview")) params.set("emailPreview", "1");

    const qs = params.toString();

    const data = await mainSiteFetch(`/api/finance/workflows${qs ? `?${qs}` : ""}`);

    return NextResponse.json(data);

  } catch (error) {

    if (error instanceof MainSiteError) {

      return NextResponse.json({ error: error.message }, { status: error.status });

    }

    const message = error instanceof Error ? error.message : "Could not load workflows";

    return NextResponse.json({ error: message }, { status: 502 });

  }

}



export async function PATCH(req: NextRequest) {

  if (!(await isAuthenticated())) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }

  try {

    const id = req.nextUrl.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = await req.text();

    const data = await mainSiteFetch(`/api/finance/workflows?id=${id}`, { method: "PATCH", body });

    return NextResponse.json(data);

  } catch (error) {

    if (error instanceof MainSiteError) {

      return NextResponse.json({ error: error.message }, { status: error.status });

    }

    const message = error instanceof Error ? error.message : "Could not update workflow";

    return NextResponse.json({ error: message }, { status: 502 });

  }

}

