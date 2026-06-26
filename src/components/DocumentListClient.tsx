"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { formatMoney } from "@/lib/brand";
import { formatDocDate, lineItemPreview, type DocumentSummary } from "@/lib/finance-doc";

export function DocumentListClient({
  docType,
  title,
  newHref,
  detailBase,
}: {
  docType: "invoice" | "receipt";
  title: string;
  newHref: string;
  detailBase: "/invoices" | "/receipts";
}) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/documents?type=${docType}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Could not load documents");
        setDocuments(d.documents ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [docType]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link
          href={newHref}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-medium text-black"
        >
          <Plus className="h-4 w-4" /> New
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}. Check <Link href="/api/health" className="underline text-gold">/api/health</Link> — FINANCE_API_KEY must match Render.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((d) => (
            <Link
              key={d.id}
              href={`${detailBase}/${d.id}`}
              className="group block rounded-xl border border-white/10 bg-white/5 px-4 py-4 hover:border-gold/40 hover:bg-gold/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-gold">{d.number}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide capitalize">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{d.clientName}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{lineItemPreview(d)}</p>
                  <p className="text-xs text-muted mt-2">
                    {formatDocDate(d.docDate)}
                    {docType === "receipt" && d.invoiceRef && ` · Invoice ${d.invoiceRef}`}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="font-semibold">{formatMoney(d.total, d.currency)}</p>
                    <p className="text-xs text-muted mt-1">Tap to view full {docType}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted group-hover:text-gold" />
                </div>
              </div>
            </Link>
          ))}
          {!documents.length && !error && (
            <p className="text-muted text-sm">No {docType}s yet. Create one with New.</p>
          )}
        </div>
      )}
    </>
  );
}
