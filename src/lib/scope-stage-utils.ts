import type { ScopeLineDraft } from "@/components/ScopeAiAssistant";

export type ScopeStageRow = ScopeLineDraft;

export function timelineToSuggestedDueDate(timeline: string): string {
  const t = timeline.toLowerCase().trim();
  const now = new Date();
  const addDays = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  if (/24\s*h|1\s*day/.test(t)) return addDays(1);
  if (/2\s*[-–]\s*3\s*day|2\s*to\s*3\s*day/.test(t)) return addDays(3);
  if (/3\s*[-–]\s*5\s*day/.test(t)) return addDays(5);
  if (/4\s*[-–]\s*6\s*day/.test(t)) return addDays(6);
  if (/1\s*[-–]\s*2\s*week/.test(t)) return addDays(14);
  if (/2\s*[-–]\s*3\s*week/.test(t)) return addDays(21);
  if (/3\s*[-–]\s*4\s*week/.test(t)) return addDays(28);
  if (/week/.test(t)) return addDays(7);
  if (/month|ongoing|scheduled/.test(t)) return addDays(30);

  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch) return addDays(Number(dayMatch[1]));

  return "";
}

export function scopeLinesToStageRows(brief: string, lines: ScopeLineDraft[]): { brief: string; stages: ScopeStageRow[] } {
  return {
    brief,
    stages: lines.map((l) => ({
      ...l,
      dueDate: l.dueDate || timelineToSuggestedDueDate(l.timeline || ""),
    })),
  };
}

export function stageRowsToWorkflowStages(rows: ScopeStageRow[]) {
  return rows
    .filter((s) => s.title.trim())
    .map((s) => ({
      title: s.title.trim(),
      description: [s.description.trim(), s.timeline ? `Timeline: ${s.timeline}` : ""].filter(Boolean).join(" · ") || undefined,
      cost: Number(s.cost) || 0,
      quantity: Math.max(1, Number(s.quantity) || 1),
      dueDate: s.dueDate || null,
      timeline: s.timeline?.trim() || null,
    }));
}
