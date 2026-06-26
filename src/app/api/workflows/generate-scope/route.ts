import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { generateScopeFromDescription } from "@/lib/scope-generator";
import { z } from "zod";

const schema = z.object({ projectDescription: z.string().min(10).max(8000) });

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const result = await generateScopeFromDescription(body.projectDescription);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Describe the project in a few sentences." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not generate scope";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
