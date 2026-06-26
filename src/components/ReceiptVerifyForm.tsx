"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { parseJsonResponse } from "@/lib/parse-json";

type InvoiceOption = { id: string; number: string; clientName: string; total: number; status: string };

export function ReceiptVerifyForm() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/documents?type=invoice")
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((d) => setInvoices((d.documents ?? []).filter((i: InvoiceOption) => i.status !== "paid")))
      .catch(() => setInvoices([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const inv = invoiceNumber.trim();
    const code = mpesaCode.trim();
    if (!inv || !code) {
      setError("Enter both the invoice number and the M-Pesa confirmation code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/receipts/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNumber: inv, mpesaReceiptNumber: code }),
    });
    const data = await parseJsonResponse<{ error?: string; message?: string; receipt?: { id: string } }>(res);
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Verification failed");
      return;
    }

    setSuccess(data.message || "Receipt issued.");
    const receiptId = data.receipt?.id;
    if (receiptId) {
      setTimeout(() => router.push(`/receipts/${receiptId}`), 1500);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-gold mb-2">
          <ShieldCheck className="h-4 w-4" />
          Verify before issuing
        </p>
        <p>
          Enter the invoice number and the M-Pesa confirmation code from the client&apos;s SMS. The system
          compares the code with completed M-Pesa payments on record for that invoice. If they match, a signed
          receipt is generated and emailed automatically.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Invoice number <span className="text-gold">*</span>
        </label>
        {invoices.length > 0 ? (
          <select
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm"
          >
            <option value="">Select invoice…</option>
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
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          M-Pesa confirmation code <span className="text-gold">*</span>
        </label>
        <input
          required
          placeholder="e.g. THH8X9K2LM"
          value={mpesaCode}
          onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono uppercase tracking-wide"
        />
        <p className="text-xs text-muted mt-1">
          From the client&apos;s M-Pesa SMS after paying the Till. Must match a completed payment in the system.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-life-green">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-gold px-6 py-3 font-medium text-black hover:bg-gold/90 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Verify M-Pesa &amp; issue receipt
      </button>
    </form>
  );
}
