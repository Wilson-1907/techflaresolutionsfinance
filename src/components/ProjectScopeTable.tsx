type Stage = {
  title: string;
  description?: string;
  cost?: number;
  quantity?: number;
  dueDate?: string | null;
  timeline?: string;
};

function lineTotal(stage: Stage) {
  return (stage.cost ?? 0) * (stage.quantity ?? 1);
}

function timelineLabel(stage: Stage) {
  if (stage.timeline) return stage.timeline;
  if (stage.dueDate) {
    try {
      return new Date(stage.dueDate).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return stage.dueDate;
    }
  }
  return "—";
}

export function ProjectScopeTable({ stages, compact }: { stages: Stage[]; compact?: boolean }) {
  if (stages.length === 0) return null;

  return (
    <div className={`overflow-x-auto rounded-xl border border-gold/20 ${compact ? "text-xs" : "text-sm"}`}>
      <table className="w-full min-w-[480px]">
        <thead>
          <tr className="bg-gold/10 text-left text-gold">
            <th className="p-3 font-semibold">#</th>
            <th className="p-3 font-semibold">Service</th>
            <th className="p-3 font-semibold text-right">Price (KES)</th>
            <th className="p-3 font-semibold">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, i) => (
            <tr key={`${s.title}-${i}`} className="border-t border-white/10">
              <td className="p-3 text-muted">{i + 1}</td>
              <td className="p-3">
                <p className="font-medium">{s.title}</p>
                {s.description && <p className="text-muted mt-0.5">{s.description}</p>}
              </td>
              <td className="p-3 text-right font-semibold text-gold whitespace-nowrap">
                {lineTotal(s).toLocaleString()}
              </td>
              <td className="p-3 whitespace-nowrap">{timelineLabel(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
