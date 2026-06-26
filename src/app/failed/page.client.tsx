"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Mail, RefreshCw } from "lucide-react";
import { validateFinanceSendReady } from "@/lib/workflow-send-validation";

type FailedWorkflow = {
  id: string;
  title: string;
  status: string;
  emailLastError?: string | null;
  emailLastAttemptAt?: string | null;
  financeDocId?: string | null;
  financeStages?: unknown;
  financeTotal?: number | null;
  depositPercent?: number | null;
  client?: { firstName: string; lastName: string; email: string } | null;
  department?: { name: string } | null;
};

export default function FailedDeliveriesPage() {
  const [items, setItems] = useState<FailedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/workflows?failed=1")
      .then((r) => r.json().catch(() => ({})))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function retry(w: FailedWorkflow) {
    const stages = Array.isArray(w.financeStages) ? w.financeStages : [];
    const check = validateFinanceSendReady({
      clientEmail: w.client?.email,
      financeDocId: w.financeDocId,
      stages: stages as Parameters<typeof validateFinanceSendReady>[0]["stages"],
      depositPercent: w.depositPercent ?? 60,
      requirePreparedInvoice: true,
    });
    if (!check.ok) {
      alert("Fix these issues before resending:\n\n" + check.errors.join("\n"));
      return;
    }
    setBusy(w.id);
    try {
      const res = await fetch(`/api/workflows?id=${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "retry_client_email",
          depositPercent: w.depositPercent ?? 60,
          financeStages: stages,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errs = data.errors as string[] | undefined;
        throw new Error(errs?.join("\n") || data.error || "Retry failed");
      }
      alert(`Email sent to ${w.client?.email || "client"}.`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Retry failed");
      load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-red-400" />
            Failed email deliveries
          </h1>
          <p className="text-muted text-sm max-w-2xl">
            Proposals released to the client portal but the email did not send. Fix missing fields or email config
            (RESEND_API_KEY on Render), then retry.
          </p>
        </div>
        <Link href="/workflows" className="text-sm text-gold hover:underline">
          ← Back to workflows
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-life-green/30 bg-life-green/5 p-6 text-sm">
          <p className="font-medium text-life-green">No failed deliveries</p>
          <p className="text-muted mt-1">All client proposal emails sent successfully, or none attempted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((w) => (
            <div key={w.id} className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex flex-wrap justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-lg">{w.title}</p>
                  <p className="text-xs text-muted capitalize">
                    {w.status.replace(/_/g, " ").toLowerCase()}
                    {w.department && ` · ${w.department.name}`}
                  </p>
                  {w.client && (
                    <p className="text-sm mt-1">
                      Client: {w.client.firstName} {w.client.lastName}
                      {w.client.email ? (
                        <span className="text-muted"> · {w.client.email}</span>
                      ) : (
                        <span className="text-red-400"> · No email on file</span>
                      )}
                    </p>
                  )}
                </div>
                {w.emailLastAttemptAt && (
                  <p className="text-xs text-muted">
                    Last attempt: {new Date(w.emailLastAttemptAt).toLocaleString("en-KE")}
                  </p>
                )}
              </div>
              {w.emailLastError && (
                <p className="text-sm text-red-300 mb-4 rounded-lg bg-black/30 p-3 whitespace-pre-wrap">
                  {w.emailLastError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === w.id || !w.client?.email || !w.financeDocId}
                  onClick={() => retry(w)}
                  className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                >
                  {busy === w.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Retry email
                </button>
                <Link
                  href="/workflows"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/5"
                >
                  <Mail className="h-4 w-4" />
                  Edit in workflows
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
