"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { parseJsonResponse } from "@/lib/parse-json";

type Props = {
  workflowId: string;
  invoiceNumber?: string | null;
  disabled?: boolean;
  onSuccess?: (message: string) => void;
};

export function WorkflowDepositVerifyForm({ workflowId, invoiceNumber, disabled, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter the M-Pesa confirmation code from the client's SMS.");
      return;
    }
    if (!invoiceNumber?.trim()) {
      setError("No invoice linked to this workflow — open the invoice statement first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/receipts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          mpesaReceiptNumber: trimmed,
          workflowId,
        }),
      });
      const data = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      setCode("");
      onSuccess?.(data.message || "Deposit verified. Receipt issued.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gold/25 bg-gold/5 p-3 space-y-2">
      <p className="text-xs font-medium text-gold flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Mark deposit paid — verify M-Pesa code
      </p>
      {invoiceNumber ? (
        <p className="text-xs text-muted-foreground font-mono">Invoice: {invoiceNumber}</p>
      ) : (
        <p className="text-xs text-amber-300">No invoice number on file for this workflow.</p>
      )}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[12rem]">
          <label className="sr-only" htmlFor={`mpesa-${workflowId}`}>
            M-Pesa confirmation code
          </label>
          <input
            id={`mpesa-${workflowId}`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="M-Pesa code e.g. THH8X9K2LM"
            disabled={disabled || loading || !invoiceNumber}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono uppercase tracking-wide"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || loading || !invoiceNumber}
          className="rounded-lg bg-life-green px-3 py-2 text-xs font-semibold text-black disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Verify &amp; mark paid
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
