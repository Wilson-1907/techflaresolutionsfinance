"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Trash2, Mail, FileText, Eye, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { validateFinanceSendReady } from "@/lib/workflow-send-validation";
import { parseJsonResponse } from "@/lib/parse-json";
import { WorkflowDepositVerifyForm } from "@/components/WorkflowDepositVerifyForm";
import { ScopeAiAssistant } from "@/components/ScopeAiAssistant";
import { CatalogStagePicker } from "@/components/CatalogStagePicker";
import { scopeLinesToStageRows, stageRowsToWorkflowStages } from "@/lib/scope-stage-utils";

type Stage = { title: string; description?: string; cost?: number; quantity?: number; dueDate?: string | null; timeline?: string | null };

type StageRow = { title: string; cost: string; quantity: string; dueDate: string; description: string; timeline: string };

type Workflow = {
  id: string;
  title: string;
  status: string;
  financeDocId?: string | null;
  receiptDocId?: string | null;
  hodBrief?: string | null;
  hodBudget?: number | null;
  hodStages?: Stage[] | null;
  financeTotal?: number | null;
  financeStages?: Stage[] | null;
  financeNotes?: string | null;
  depositPercent?: number | null;
  emailDeliveryStatus?: string | null;
  emailLastError?: string | null;
  invoice?: { id: string; number: string; total: number; status: string } | null;
  client?: { firstName: string; lastName: string; email: string } | null;
  department?: { name: string } | null;
};

type EmailPreview = {
  to: string | null;
  subject: string;
  html: string;
  text: string;
};

type WorkflowEdit = { notes: string; depositPercent: string; stages: StageRow[]; editing: boolean };

function sumStageCosts(stages: Stage[]) {
  return stages.reduce((sum, s) => sum + (s.cost ?? 0) * (s.quantity ?? 1), 0);
}

function stagesToRows(stages: Stage[]): StageRow[] {
  if (stages.length === 0) return [{ title: "", cost: "", quantity: "1", dueDate: "", description: "", timeline: "" }];
  return stages.map((s) => ({
    title: s.title,
    cost: String(s.cost ?? ""),
    quantity: String(s.quantity ?? 1),
    dueDate: s.dueDate ? String(s.dueDate).slice(0, 10) : "",
    description: s.description ?? "",
    timeline: s.timeline ?? "",
  }));
}

function rowsToStages(rows: StageRow[]): Stage[] {
  return stageRowsToWorkflowStages(rows);
}

function getStages(w: Workflow): Stage[] {
  const raw = w.financeStages ?? w.hodStages;
  if (!raw || !Array.isArray(raw)) return [];
  return raw as Stage[];
}

function SentWorkflowCard({
  w,
  busy,
  expanded,
  onToggle,
  onDepositVerified,
  onResendReceipt,
}: {
  w: Workflow;
  busy: string | null;
  expanded: boolean;
  onToggle: () => void;
  onDepositVerified: (message: string) => void;
  onResendReceipt?: () => void;
}) {
  const stages = getStages(w);
  const total = sumStageCosts(stages) || w.financeTotal || w.hodBudget || 0;
  const depositPct = w.depositPercent ?? 60;
  const depositDue = Math.round(total * (depositPct / 100));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-semibold">{w.title}</p>
          <p className="text-xs text-muted capitalize">
            {w.status.replace(/_/g, " ").toLowerCase()}
            {w.department && ` · ${w.department.name}`}
            {w.client && ` · ${w.client.firstName} ${w.client.lastName}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gold font-bold">KES {total.toLocaleString()}</p>
          <p className="text-xs text-muted">Deposit ({depositPct}%): KES {depositDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {w.financeDocId && (
          <Link
            href={`/invoices/${w.financeDocId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10"
          >
            <FileText className="h-3 w-3" />
            View invoice statement
          </Link>
        )}
        {w.receiptDocId && (
          <Link
            href={`/receipts/${w.receiptDocId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-life-green/30 px-3 py-1 text-xs text-life-green hover:bg-life-green/10"
          >
            <FileText className="h-3 w-3" />
            View receipt
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 text-xs hover:bg-white/5"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide details" : "Full details"}
        </button>
        {onResendReceipt && (
          <button
            type="button"
            disabled={busy === w.id}
            onClick={onResendReceipt}
            className="rounded border border-white/20 px-2 py-0.5 text-xs hover:bg-white/5 disabled:opacity-50"
          >
            Resend receipt email
          </button>
        )}
      </div>

      {w.status !== "DEPOSIT_PAID" && (
        <WorkflowDepositVerifyForm
          workflowId={w.id}
          invoiceNumber={w.invoice?.number}
          disabled={busy === w.id}
          onSuccess={onDepositVerified}
        />
      )}

      {expanded && (
        <div className="space-y-3 border-t border-white/10 pt-3 text-sm">
          {w.hodBrief && (
            <div>
              <p className="text-xs text-muted mb-1">HOD scope brief</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{w.hodBrief}</p>
            </div>
          )}
          {w.financeNotes && (
            <div>
              <p className="text-xs text-muted mb-1">Finance notes</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{w.financeNotes}</p>
            </div>
          )}
          {stages.length > 0 && (
            <ul className="space-y-2">
              {stages.map((s, i) => (
                <li key={i} className="rounded-lg bg-black/20 px-3 py-2">
                  <span className="font-medium">
                    {i + 1}. {s.title}
                    {s.quantity != null && s.quantity > 1 ? ` × ${s.quantity}` : ""}
                  </span>
                  {s.cost != null && (
                    <span className="text-gold ml-2">
                      KES {((s.cost ?? 0) * (s.quantity ?? 1)).toLocaleString()}
                    </span>
                  )}
                  {s.dueDate && (
                    <span className="text-muted text-xs ml-2">
                      due {new Date(s.dueDate).toLocaleDateString("en-KE")}
                    </span>
                  )}
                  {s.description && <p className="text-xs text-muted mt-1">{s.description}</p>}
                </li>
              ))}
            </ul>
          )}
          {w.client?.email && (
            <p className="text-xs text-muted">Client email: {w.client.email}</p>
          )}
        </div>
      )}
    </div>
  );
}

function EmailPreviewPanel({
  workflowId,
  open,
  onClose,
}: {
  workflowId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [invoice, setInvoice] = useState<{ number: string; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/workflows?id=${workflowId}&emailPreview=1`)
      .then((r) => parseJsonResponse<{ emailPreview?: EmailPreview; invoice?: { number: string; total: number } }>(r))
      .then((d) => {
        setPreview(d?.emailPreview ?? null);
        setInvoice(d?.invoice ?? null);
      })
      .catch(() => {
        setPreview(null);
        setInvoice(null);
      })
      .finally(() => setLoading(false));
  }, [open, workflowId]);

  if (!open) return null;

  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-black/40 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gold" />
          <p className="text-sm font-semibold text-gold">Email preview (not sent yet)</p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-muted hover:text-white">
          Close
        </button>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gold" />
      ) : preview ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted">To:</span> {preview.to || "—"}
          </p>
          <p>
            <span className="text-muted">Subject:</span> {preview.subject}
          </p>
          {invoice && (
            <p className="text-xs text-muted">
              Invoice {invoice.number} · KES {invoice.total.toLocaleString()} (draft — client cannot see until you send)
            </p>
          )}
          <div className="rounded-lg border border-white/10 bg-white p-4 text-black max-h-72 overflow-y-auto text-sm">
            <div dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted">Plain text version</summary>
            <pre className="mt-2 whitespace-pre-wrap text-muted bg-black/30 p-2 rounded">{preview.text}</pre>
          </details>
        </div>
      ) : (
        <p className="text-sm text-muted">Prepare the invoice first to preview the email.</p>
      )}
    </div>
  );
}

export default function FinanceWorkflowsPage() {
  const [items, setItems] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, WorkflowEdit>>({});
  const [emailPreviewId, setEmailPreviewId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [failedCount, setFailedCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function load() {
    fetch("/api/workflows")
      .then((r) => parseJsonResponse<{ items?: Workflow[]; failedCount?: number }>(r))
      .then((d) => {
        setItems(d.items || []);
        setFailedCount(d.failedCount ?? 0);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }

  function validateWorkflowAction(w: Workflow, edit: WorkflowEdit, action: string) {
    const stages = rowsToStages(edit.stages);
    const depositPct = Number(edit.depositPercent) || 60;
    const requireInvoice = action === "finance_send_to_client";
    const needsStages =
      action === "finance_review" ||
      action === "finance_prepare_invoice" ||
      action === "finance_send_to_client" ||
      action === "finance_approve_and_send";
    if (!needsStages) return { ok: true as const };
    return validateFinanceSendReady({
      clientEmail: w.client?.email,
      financeDocId: w.financeDocId,
      stages,
      depositPercent: depositPct,
      requirePreparedInvoice: requireInvoice,
    });
  }

  useEffect(() => {
    load();
  }, []);

  function getEdit(w: Workflow): WorkflowEdit {
    if (edits[w.id]) return edits[w.id];
    const stages = getStages(w);
    const needsStructure = !w.financeStages || (Array.isArray(w.financeStages) && w.financeStages.length === 0);
    return {
      notes: w.financeNotes || "",
      depositPercent: String(w.depositPercent ?? 60),
      stages: stagesToRows(
        stages.length > 0 ? stages : [{ title: "", cost: 0, quantity: 1, dueDate: null, description: "" }]
      ),
      editing: needsStructure || stages.length === 0,
    };
  }

  function setEdit(id: string, patch: Partial<WorkflowEdit>) {
    const w = items.find((x) => x.id === id);
    if (!w) return;
    setEdits((prev) => ({ ...prev, [id]: { ...getEdit(w), ...patch } }));
  }

  async function patch(id: string, body: Record<string, unknown>, w?: Workflow) {
    const action = String(body.action ?? "");
    if (w && ["finance_review", "finance_prepare_invoice", "finance_send_to_client", "finance_approve_and_send"].includes(action)) {
      const edit = getEdit(w);
      const check = validateWorkflowAction(w, edit, action);
      if (!check.ok) {
        setFieldErrors((prev) => ({ ...prev, [id]: check.errors }));
        alert("Complete all required fields before sending:\n\n" + check.errors.join("\n"));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, [id]: [] }));
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/workflows?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await parseJsonResponse<Record<string, unknown>>(res);
      if (!res.ok) {
        const errs = data.errors as string[] | undefined;
        throw new Error(errs?.length ? errs.join("\n") : (data.error as string) || `Request failed (${res.status})`);
      }
      if (body.action === "finance_prepare_invoice") {
        setEmailPreviewId(id);
      }
      if (body.action === "finance_send_to_client" || body.action === "finance_approve_and_send") {
        setEmailPreviewId(null);
        const email = data.email as { sent?: boolean; error?: string } | undefined;
        if (email && email.sent === false) {
          setFailedCount((c) => c + 1);
          alert(
            `Proposal released to client portal, but email failed:\n\n${email.error}\n\nSee Failed deliveries in the menu.`
          );
        } else {
          alert(`Email sent to client${data.invoice ? ` — invoice ${(data.invoice as { number: string }).number}` : ""}.`);
        }
      }
      if (body.action === "record_deposit") {
        alert(data.message || "Deposit verified. Receipt generated and sent to client.");
      }
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
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

  const queue = items.filter((w) => ["HOD_BUDGET_SUBMITTED", "FINANCE_REVIEW"].includes(w.status));
  const awaitingPayment = items.filter((w) => ["SENT_TO_CLIENT", "CLIENT_AGREED"].includes(w.status));
  const paidQueue = items.filter((w) => w.status === "DEPOSIT_PAID");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Project workflows</h1>
      <p className="text-muted text-sm mb-4">
        HOD sends the first invoice draft with stages (amount, quantity, timeline). All fields are required before
        Finance can save, prepare, or send. Each stage needs title, unit price, quantity, and due date; client email is
        required.
      </p>
      {failedCount > 0 && (
        <Link
          href="/failed"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20"
        >
          <AlertTriangle className="h-4 w-4" />
          {failedCount} failed email delivery{failedCount === 1 ? "" : "ies"} — review &amp; retry
        </Link>
      )}

      {queue.length === 0 ? (
        <p className="text-muted text-sm">No budgets awaiting finance review.</p>
      ) : (
        <div className="space-y-6">
          {queue.map((w) => {
            const edit = getEdit(w);
            const stages = edit.editing ? rowsToStages(edit.stages) : getStages(w);
            const total = sumStageCosts(stages) || w.financeTotal || w.hodBudget || 0;
            const depositPct = Number(edit.depositPercent) || 60;
            const depositDue = Math.round(total * (depositPct / 100));
            const hasInvoice = Boolean(w.financeDocId);

            return (
              <div key={w.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-lg">{w.title}</p>
                    <p className="text-xs text-muted capitalize">
                      {hasInvoice ? "Finance — invoice prepared (not sent to client)" : w.status.replace(/_/g, " ").toLowerCase()}
                      {w.department && ` · ${w.department.name}`}
                      {w.client && ` · ${w.client.firstName} ${w.client.lastName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gold">KES {total.toLocaleString()}</p>
                    <p className="text-xs text-muted">Deposit ({depositPct}%): KES {depositDue.toLocaleString()}</p>
                  </div>
                </div>

                {hasInvoice && (
                  <div className="mb-4 flex flex-wrap gap-2 items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span>Invoice ready in finance (draft)</span>
                    <Link href={`/invoices/${w.financeDocId}`} className="text-gold underline text-xs">
                      View invoice document
                    </Link>
                    {w.client?.email && <span className="text-xs text-muted">→ will email {w.client.email}</span>}
                  </div>
                )}

                {w.hodBrief && (
                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{w.hodBrief}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setEdit(w.id, { editing: !edit.editing, stages: stagesToRows(getStages(w)) })}
                    className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10"
                  >
                    <Pencil className="h-3 w-3" />
                    {edit.editing ? "View only" : "Edit stages & payment"}
                  </button>
                  {hasInvoice && (
                    <button
                      type="button"
                      onClick={() => setEmailPreviewId(emailPreviewId === w.id ? null : w.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 text-xs hover:bg-white/5"
                    >
                      <Eye className="h-3 w-3" />
                      {emailPreviewId === w.id ? "Hide email preview" : "Preview client email"}
                    </button>
                  )}
                </div>

                <EmailPreviewPanel
                  workflowId={w.id}
                  open={emailPreviewId === w.id && hasInvoice}
                  onClose={() => setEmailPreviewId(null)}
                />

                {edit.editing ? (
                  <div className="space-y-2 mb-4">
                    <ScopeAiAssistant
                      onApply={(brief, lines) => {
                        const { stages } = scopeLinesToStageRows(brief, lines);
                        setEdit(w.id, { stages: stages as StageRow[], editing: true });
                      }}
                    />
                    <CatalogStagePicker
                      onAdd={(row) =>
                        setEdit(w.id, { stages: [...edit.stages, row as StageRow], editing: true })
                      }
                    />
                    {edit.stages.map((row, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-12 rounded-lg bg-black/20 p-3">
                        <input
                          placeholder="Stage title"
                          value={row.title}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], title: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-4 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], quantity: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-1 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Unit price"
                          value={row.cost}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], cost: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-2 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <input
                          placeholder="Timeline"
                          value={row.timeline}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], timeline: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-2 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="date"
                          value={row.dueDate}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], dueDate: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-2 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <input
                          placeholder="Description"
                          value={row.description}
                          onChange={(e) => {
                            const next = [...edit.stages];
                            next[i] = { ...next[i], description: e.target.value };
                            setEdit(w.id, { stages: next });
                          }}
                          className="sm:col-span-12 rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setEdit(w.id, { stages: edit.stages.filter((_, j) => j !== i) })}
                          className="sm:col-span-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setEdit(w.id, {
                          stages: [...edit.stages, { title: "", cost: "", quantity: "1", dueDate: "", description: "", timeline: "" }],
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-gold"
                    >
                      <Plus className="h-3 w-3" /> Add stage
                    </button>
                    <div className="mt-2">
                      <label className="text-xs text-muted">Deposit %</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={edit.depositPercent}
                        onChange={(e) => setEdit(w.id, { depositPercent: e.target.value })}
                        className="w-24 ml-2 rounded border border-white/10 bg-black/30 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  stages.length > 0 && (
                    <ul className="text-sm space-y-2 mb-4">
                      {stages.map((s, i) => (
                        <li key={i} className="rounded-lg bg-black/20 px-3 py-2">
                          <span className="font-medium">
                            {i + 1}. {s.title}
                            {s.quantity != null && s.quantity > 1 ? ` × ${s.quantity}` : ""}
                          </span>
                          {s.cost != null && (
                            <span className="text-gold ml-2">
                              KES {((s.cost ?? 0) * (s.quantity ?? 1)).toLocaleString()}
                            </span>
                          )}
                          {s.dueDate && (
                            <span className="text-muted text-xs ml-2">
                              due {new Date(s.dueDate).toLocaleDateString("en-KE")}
                            </span>
                          )}
                          {s.description && <p className="text-xs text-muted mt-1">{s.description}</p>}
                        </li>
                      ))}
                    </ul>
                  )
                )}

                <div className="mb-4">
                  <label className="text-xs text-muted">Finance notes</label>
                  <textarea
                    value={edit.notes}
                    onChange={(e) => setEdit(w.id, { notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm mt-1"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === w.id || hasInvoice}
                    onClick={() => {
                      if (
                        !confirm(
                          `Approve HOD invoice and send to ${w.client?.email || "client"} with no further edits?`
                        )
                      )
                        return;
                      patch(w.id, {
                        action: "finance_approve_and_send",
                        financeNotes: edit.notes,
                        financeStages: stages,
                        depositPercent: depositPct,
                      }, w);
                    }}
                    className="rounded-lg bg-life-green px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    Approve &amp; send (no edits)
                  </button>
                  <button
                    type="button"
                    disabled={busy === w.id}
                    onClick={() =>
                      patch(w.id, {
                        action: "finance_review",
                        financeNotes: edit.notes,
                        financeStages: stages,
                        depositPercent: depositPct,
                      }, w)
                    }
                    className="rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-gold hover:bg-gold/10 disabled:opacity-50"
                  >
                    1. Save stages &amp; review
                  </button>
                  <button
                    type="button"
                    disabled={busy === w.id || hasInvoice}
                    onClick={() =>
                      patch(w.id, {
                        action: "finance_prepare_invoice",
                        financeNotes: edit.notes,
                        financeStages: stages,
                        depositPercent: depositPct,
                      }, w)
                    }
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    2. Prepare invoice (finance only)
                  </button>
                  <button
                    type="button"
                    disabled={busy === w.id || !hasInvoice}
                    onClick={() => {
                      if (
                        !confirm(
                          `Send email to ${w.client?.email || "client"} and release proposal to their portal?`
                        )
                      )
                        return;
                      patch(w.id, {
                        action: "finance_send_to_client",
                        financeNotes: edit.notes,
                        financeStages: stages,
                        depositPercent: depositPct,
                      }, w);
                    }}
                    className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    3. Send email &amp; release to client
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paidQueue.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-10 mb-4">Deposit paid — HOD notified</h2>
          <div className="space-y-3">
            {paidQueue.map((w) => (
              <SentWorkflowCard
                key={w.id}
                w={w}
                busy={busy}
                expanded={expandedId === w.id}
                onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                onDepositVerified={(message) => {
                  alert(message);
                  load();
                }}
                onResendReceipt={() => patch(w.id, { action: "send_receipt" }, w)}
              />
            ))}
          </div>
        </>
      )}

      {awaitingPayment.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-10 mb-4">Sent to client — awaiting agreement / payment</h2>
          <div className="space-y-3">
            {awaitingPayment.map((w) => (
              <SentWorkflowCard
                key={w.id}
                w={w}
                busy={busy}
                expanded={expandedId === w.id}
                onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                onDepositVerified={(message) => {
                  alert(message);
                  load();
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
