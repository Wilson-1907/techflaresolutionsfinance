"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { formatMoney } from "@/lib/brand";

type Entry = {
  id: string;
  entryType: string;
  direction: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  entryDate: string;
  notes?: string | null;
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    entryType: "expense" as "expense" | "salary" | "investment" | "income",
    amount: "",
    description: "",
    category: "",
    entryDate: new Date().toISOString().slice(0, 10),
    notes: "",
    investmentDirection: "out" as "in" | "out",
  });

  function load() {
    fetch("/api/ledger")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setEntries(d.entries ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType: form.entryType,
          amount: Number(form.amount),
          description: form.description,
          category: form.category || undefined,
          entryDate: form.entryDate,
          notes: form.notes || undefined,
          ...(form.entryType === "investment" ? { direction: form.investmentDirection } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({
        entryType: "expense",
        amount: "",
        description: "",
        category: "",
        entryDate: new Date().toISOString().slice(0, 10),
        notes: "",
        investmentDirection: "out",
      });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const moneyIn = entries.filter((e) => e.direction === "in").reduce((s, e) => s + e.amount, 0);
  const moneyOut = entries.filter((e) => e.direction === "out").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Finance Ledger</h1>
          <p className="text-sm text-muted">
            All money entering and leaving TechFlare — automatic from payments plus manual records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-medium text-black"
        >
          <Plus className="h-4 w-4" /> Record expense / salary / investment
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-life-green/30 bg-life-green/5 p-5">
          <ArrowDownLeft className="h-6 w-6 text-life-green mb-2" />
          <p className="text-2xl font-bold text-life-green">{formatMoney(moneyIn)}</p>
          <p className="text-xs text-muted">Total money in (ledger)</p>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <ArrowUpRight className="h-6 w-6 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">{formatMoney(moneyOut)}</p>
          <p className="text-xs text-muted">Total money out (ledger)</p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <p className="text-2xl font-bold text-gold">{formatMoney(moneyIn - moneyOut)}</p>
          <p className="text-xs text-muted">Net balance</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-gold/30 bg-white/5 p-5 mb-8 space-y-4">
          <h2 className="font-semibold">Record manual entry</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted">Type</label>
              <select
                value={form.entryType}
                onChange={(e) => setForm({ ...form, entryType: e.target.value as typeof form.entryType })}
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="expense">Expenditure</option>
                <option value="salary">Salary paid</option>
                <option value="investment">Investment</option>
                <option value="income">Other income</option>
              </select>
            </div>
            {form.entryType === "investment" && (
              <div>
                <label className="text-xs text-muted">Investment direction</label>
                <select
                  value={form.investmentDirection}
                  onChange={(e) =>
                    setForm({ ...form, investmentDirection: e.target.value as "in" | "out" })
                  }
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                >
                  <option value="out">Money out (capex / purchase)</option>
                  <option value="in">Money in (return / divestment)</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-muted">Amount (KES)</label>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Date</label>
              <input
                type="date"
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted">Description</label>
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. March payroll — engineering team"
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Category (optional)</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="vendor, payroll, capex…"
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Notes (optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save to ledger"}
          </button>
        </form>
      )}

      <h2 className="text-lg font-semibold mb-3">All transactions</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No ledger entries yet. Payments will appear automatically.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.id}
              className={`flex flex-wrap justify-between gap-2 rounded-xl border px-4 py-3 ${
                e.direction === "in" ? "border-life-green/20 bg-life-green/5" : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {e.direction === "in" ? (
                    <ArrowDownLeft className="h-4 w-4 text-life-green shrink-0" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-400 shrink-0" />
                  )}
                  <p className="font-medium truncate">{e.description}</p>
                </div>
                <p className="text-xs text-muted mt-1 capitalize">
                  {e.entryType} · {e.category} · {new Date(e.entryDate).toLocaleDateString("en-KE")}
                </p>
              </div>
              <p className={`font-bold shrink-0 ${e.direction === "in" ? "text-life-green" : "text-red-400"}`}>
                {e.direction === "in" ? "+" : "−"}
                {formatMoney(e.amount, e.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
