"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calcSplits, calcTotals, financeBrand, type FinanceLineItem } from "@/lib/brand";

type Props = {
  docType: "invoice" | "receipt";
};

type InvoiceOption = { id: string; number: string; clientName: string; total: number; status: string };

const emptyItem = (): FinanceLineItem => ({ description: "", qty: 1, unitPrice: 0 });

function localNextInvoiceRef(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `TFS/${yy}/${mm}/001`;
}

export function DocumentForm({ docType }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod] = useState("M-Pesa Till 9356451");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [showOnMainSite, setShowOnMainSite] = useState(false);
  const [lineItems, setLineItems] = useState<FinanceLineItem[]>([emptyItem()]);
  const [splits, setSplits] = useState<{ party: string; percent: number }[]>([]);
  const [nextInvoiceRef, setNextInvoiceRef] = useState("");
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [connectionOk, setConnectionOk] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        if (h.financeApiKeyValid === false) {
          setConnectionOk(false);
          setError(
            "Finance API key rejected by backend. In Vercel → Finance panel → Environment Variables, set FINANCE_API_KEY to match Render exactly, and BACKEND_URL=https://techflaresolutionsback.onrender.com"
          );
        }
      })
      .catch(() => {});

    if (docType === "invoice") {
      fetch("/api/documents?type=invoice&nextNumber=true")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.nextNumber) setNextInvoiceRef(d.nextNumber);
        })
        .catch(() => {});
    } else {
      fetch("/api/documents?type=invoice")
        .then((r) => (r.ok ? r.json() : { documents: [] }))
        .then((d) => setInvoices(d.documents ?? []))
        .catch(() => setInvoices([]));
    }
  }, [docType]);

  const totals = calcTotals(lineItems, taxRate);
  const splitAmounts = calcSplits(totals.total, splits);

  function updateItem(i: number, patch: Partial<FinanceLineItem>) {
    setLineItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function onInvoicePick(value: string) {
    setInvoiceRef(value);
    const inv = invoices.find((i) => i.number === value);
    if (inv && !clientName) setClientName(inv.clientName);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (docType === "receipt") {
      const ref = invoiceRef.trim();
      if (!ref) {
        setError("Select the invoice this receipt is for (e.g. TFS/26/06/001)");
        return;
      }
      if (!/^TFS\/(\d{2}|\d{4})\/\d{2}\/\d+$/.test(ref)) {
        setError("Invoice reference must match TFS/YY/MM/001 (e.g. TFS/26/06/001)");
        return;
      }
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docType,
        clientName,
        clientEmail,
        clientPhone,
        clientRole,
        taxRate,
        paymentMethod: "M-Pesa Till 9356451",
        invoiceRef: docType === "receipt" ? invoiceRef.trim() : undefined,
        notes,
        showOnMainSite,
        lineItems,
        splits: splits.filter((s) => s.party.trim()),
        status: docType === "receipt" ? "paid" : "sent",
        issuerName: financeBrand.treasuryName,
        issuerTitle: financeBrand.treasuryTitle,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/${docType === "invoice" ? "invoices" : "receipts"}/${data.document.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to save document");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      {!connectionOk && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || "Backend connection issue — check FINANCE_API_KEY and BACKEND_URL in Vercel."}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <input required placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5" />
        <input placeholder="Client role" value={clientRole} onChange={(e) => setClientRole(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5" />
        <input placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5" />
        <input placeholder="Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5" />
      </div>

      {docType === "receipt" && (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Invoice you are working on <span className="text-gold">*</span>
          </label>
          {invoices.length > 0 ? (
            <select
              required
              value={invoiceRef}
              onChange={(e) => onInvoicePick(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm"
            >
              <option value="">Select invoice reference…</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.number}>
                  {inv.number} — {inv.clientName} (KES {inv.total.toLocaleString()}) · {inv.status}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              placeholder="TFS/26/06/001"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              pattern="TFS/(\d{2}|\d{4})/\d{2}/\d+"
              title="Format: TFS/YY/MM/001"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono"
            />
          )}
          <p className="text-xs text-muted mt-1">
            Receipts must link to an existing invoice reference (e.g. TFS/26/06/001).
          </p>
        </div>
      )}

      {docType === "invoice" && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-gold mb-1">Next invoice number</p>
          <p className="text-2xl font-bold font-mono text-gold">{nextInvoiceRef || localNextInvoiceRef()}</p>
        </div>
      )}

      {error && connectionOk && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-2">
        <p className="text-sm font-medium">Line items</p>
        {lineItems.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_100px] gap-2">
            <input required placeholder="Description" value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </div>
        ))}
        <button type="button" onClick={() => setLineItems([...lineItems, emptyItem()])} className="text-xs text-gold">+ Add line</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input type="number" min={0} step={0.01} placeholder="Tax rate %" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5" />
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm">
          <span className="text-muted">Payment method: </span>
          <span className="text-gold font-medium">{paymentMethod}</span>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-white/15 p-4 space-y-2">
        <p className="text-sm font-medium">Money division (optional)</p>
        {splits.map((s, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input placeholder="Party / account" value={s.party} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, party: e.target.value } : x)))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input type="number" placeholder="%" value={s.percent} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, percent: Number(e.target.value) } : x)))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </div>
        ))}
        <button type="button" onClick={() => setSplits([...splits, { party: "", percent: 0 }])} className="text-xs text-gold">+ Add split</button>
        {splitAmounts.map((s) => (
          <p key={s.party} className="text-xs text-muted">{s.party}: KES {s.amount.toLocaleString()}</p>
        ))}
      </div>

      <div className="rounded-xl bg-gold/10 border border-gold/20 p-4 text-sm">
        <p>Subtotal: KES {totals.subtotal.toLocaleString()}</p>
        <p>Tax: KES {totals.taxAmount.toLocaleString()}</p>
        <p className="font-bold text-gold">Total: KES {totals.total.toLocaleString()}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showOnMainSite} onChange={(e) => setShowOnMainSite(e.target.checked)} />
        Show on main site (client-visible)
      </label>

      <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 resize-none" />

      <button type="submit" disabled={loading || !connectionOk} className="rounded-xl bg-gold px-6 py-3 font-medium text-black hover:bg-gold/90 disabled:opacity-50">
        {loading ? "Saving..." : `Create ${docType}`}
      </button>
    </form>
  );
}
