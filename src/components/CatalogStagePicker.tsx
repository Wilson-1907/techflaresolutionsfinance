"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { timelineToSuggestedDueDate } from "@/lib/scope-stage-utils";
import type { ScopeLineDraft } from "@/components/ScopeAiAssistant";
import { parseJsonResponse } from "@/lib/parse-json";

type CatalogService = {
  id: string;
  name: string;
  currentPriceKes: number;
  typicalTimeline: string;
  description: string;
};

export function CatalogStagePicker({ onAdd }: { onAdd: (row: ScopeLineDraft) => void }) {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services/catalog")
      .then((r) => parseJsonResponse<{ services?: CatalogService[]; error?: string }>(r))
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setServices(d.services || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load catalog"));
  }, []);

  if (error) {
    return <p className="text-xs text-amber-300">{error}</p>;
  }
  if (services.length === 0) return null;

  function addFromCatalog() {
    const svc = services.find((s) => s.id === selected);
    if (!svc) return;
    onAdd({
      title: svc.name,
      cost: String(svc.currentPriceKes),
      quantity: "1",
      dueDate: timelineToSuggestedDueDate(svc.typicalTimeline),
      description: svc.description,
      timeline: svc.typicalTimeline,
    });
    setSelected("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
      <BookOpen className="h-4 w-4 text-gold shrink-0" />
      <select
        className="flex-1 min-w-[180px] rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Add from internal catalog…</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — KES {s.currentPriceKes.toLocaleString()} · {s.typicalTimeline}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected}
        onClick={addFromCatalog}
        className="rounded-lg bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-40"
      >
        Add row
      </button>
    </div>
  );
}
