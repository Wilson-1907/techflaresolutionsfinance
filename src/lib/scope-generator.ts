import { SERVICE_CATALOG, type CatalogService } from "@/data/service-catalog";

export type GeneratedScopeLine = {
  title: string;
  description?: string;
  cost?: number;
  quantity?: number;
  dueDate?: string | null;
  timeline?: string;
  catalogServiceId?: string;
};

function seasonalFactor(date = new Date()): number {
  const seasonal: Record<number, number> = {
    0: 0.92, 1: 0.94, 2: 0.96, 3: 0.98, 4: 1.0, 5: 1.02,
    6: 1.0, 7: 1.04, 8: 1.08, 9: 1.12, 10: 1.1, 11: 0.98,
  };
  return seasonal[date.getMonth()] ?? 1;
}

export function getLocalDemand() {
  const multiplier = Math.round(seasonalFactor() * 100) / 100;
  const label =
    multiplier >= 1.1 ? "High demand — prices adjusted up" :
    multiplier <= 0.95 ? "Low season — preferential rates" :
    "Standard rates";
  return { multiplier, activeProjects: 0, label };
}

export function applyDemandPrice(basePriceKes: number, multiplier: number): number {
  return Math.round((basePriceKes * multiplier) / 100) * 100;
}

export function getPublicCatalog() {
  return {
    services: SERVICE_CATALOG.map(({ basePriceKes: _b, tags: _t, ...rest }) => rest),
  };
}

export function getPricedCatalog() {
  const demand = getLocalDemand();
  return {
    services: SERVICE_CATALOG.map((s) => ({
      ...s,
      currentPriceKes: applyDemandPrice(s.basePriceKes, demand.multiplier),
      demandNote: demand.label,
    })),
    demand,
  };
}

function isLlmConfigured() {
  return !!(process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

async function chatCompletion(messages: { role: string; content: string }[], maxTokens = 1200) {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const config = groqKey
    ? { url: "https://api.groq.com/openai/v1/chat/completions", apiKey: groqKey, model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile" }
    : process.env.OPENAI_API_KEY?.trim()
      ? { url: "https://api.openai.com/v1/chat/completions", apiKey: process.env.OPENAI_API_KEY.trim(), model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini" }
      : null;
  if (!config) return null;

  const res = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || "LLM request failed");
  return data.choices?.[0]?.message?.content?.trim() || null;
}

function parseAiJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as { lines?: GeneratedScopeLine[]; summary?: string };
  } catch {
    return null;
  }
}

function fallbackScope(projectDescription: string, multiplier: number): GeneratedScopeLine[] {
  const text = projectDescription.toLowerCase();
  const lines: GeneratedScopeLine[] = [];
  const add = (id: string, overrides?: Partial<GeneratedScopeLine>) => {
    const svc = SERVICE_CATALOG.find((s) => s.id === id);
    if (!svc) return;
    lines.push({
      title: overrides?.title || svc.name,
      description: overrides?.description || svc.limits,
      cost: applyDemandPrice(svc.basePriceKes, multiplier),
      quantity: 1,
      timeline: overrides?.timeline || svc.typicalTimeline,
      catalogServiceId: id,
    });
  };

  const isBirthday = text.includes("birthday") || text.includes("celebration") || text.includes("happy");
  const hasPhotos = text.includes("photo") || text.includes("slider") || text.includes("slide");
  const hasSong = text.includes("song") || text.includes("music") || text.includes("audio");
  const isSimpleWeb = isBirthday || text.includes("simple") || text.includes("landing") || text.includes("small website");

  if (isSimpleWeb) {
    add("web-simple");
    if (hasPhotos || hasSong) add("content-media");
    add("deploy-hosting");
    return lines;
  }
  if (text.includes("mpesa") || text.includes("payment") || text.includes("stk")) add("mpesa-integration");
  if (text.includes("shop") || text.includes("ecommerce") || text.includes("store")) add("web-ecommerce");
  else if (text.includes("website") || text.includes("web app") || text.includes("portal")) add("web-custom");
  if (text.includes("mobile") || text.includes("app")) add("mobile-app-mvp");
  if (text.includes("ai") || text.includes("chatbot") || text.includes("assistant")) add("ai-chatbot");
  if (text.includes("deploy") || text.includes("host") || text.includes("domain")) add("deploy-hosting");
  if (lines.length === 0) {
    add("consulting-hour", {
      title: "Project scoping & discovery",
      description: "Initial technical review and written scope from your brief.",
      timeline: "1–2 days",
    });
  }
  return lines;
}

export async function generateScopeFromDescription(projectDescription: string) {
  const trimmed = projectDescription.trim();
  if (trimmed.length < 10) throw new Error("Describe the project in at least a few sentences.");

  const demand = getLocalDemand();
  const catalog = SERVICE_CATALOG.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    limits: s.limits,
    priceKes: applyDemandPrice(s.basePriceKes, demand.multiplier),
    typicalTimeline: s.typicalTimeline,
    tags: s.tags,
  }));

  if (isLlmConfigured()) {
    try {
      const raw = await chatCompletion([
        {
          role: "system",
          content: `You are TechFlare Solutions' finance scoping assistant. Output ONLY valid JSON:
{"summary":"one sentence","lines":[{"title":"","description":"","cost":0,"quantity":1,"timeline":"2-3 days","catalogServiceId":""}]}
Use catalog prices. 2-6 line items.`,
        },
        {
          role: "user",
          content: `CATALOG:\n${JSON.stringify(catalog)}\n\nBRIEF:\n${trimmed}`,
        },
      ]);
      if (raw) {
        const parsed = parseAiJson(raw);
        if (parsed?.lines?.length) {
          const lines = parsed.lines.map((l) => ({
            title: String(l.title || "").trim(),
            description: l.description ? String(l.description) : undefined,
            cost: Number(l.cost) || 0,
            quantity: Math.max(1, Number(l.quantity) || 1),
            timeline: l.timeline ? String(l.timeline) : undefined,
            catalogServiceId: l.catalogServiceId,
          }));
          return { summary: parsed.summary || "AI-generated scope.", lines, demand, source: "ai" as const };
        }
      }
    } catch (err) {
      console.error("[scope-generator]", err);
    }
  }

  const lines = fallbackScope(trimmed, demand.multiplier);
  return {
    summary: "Scope generated from catalog matching — review and edit before sending.",
    lines,
    demand,
    source: "fallback" as const,
  };
}
