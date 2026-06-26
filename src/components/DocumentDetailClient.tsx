"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { DocumentPrintView, type FinanceDoc } from "@/components/DocumentPrintView";
import { PrintButton } from "@/components/PrintButton";
import { normalizeFinanceDoc } from "@/lib/finance-doc";

export function DocumentDetailClient({
  id,
  docType,
  backHref,
  backLabel,
  payBaseUrl,
}: {
  id: string;
  docType: "invoice" | "receipt";
  backHref: string;
  backLabel: string;
  payBaseUrl?: string;
}) {
  const [doc, setDoc] = useState<FinanceDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/documents/${id}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) {
          throw new Error(d.error || (status === 404 ? "Document not found" : "Could not load document"));
        }
        const normalized = normalizeFinanceDoc(d.document ?? {});
        if (normalized.docType !== docType) {
          throw new Error(`This record is a ${normalized.docType}, not a ${docType}.`);
        }
        setDoc(normalized);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id, docType]);

  const payUrl =
    doc?.docType === "invoice" && doc.status !== "paid" && payBaseUrl
      ? `${payBaseUrl}/pay?invoice=${id}`
      : undefined;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-lg">
        <Link href={backHref} className="text-sm text-gold mb-4 inline-block">
          ← {backLabel}
        </Link>
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200">
          {error || "Document not found"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="no-print flex items-center justify-between mb-6">
        <Link href={backHref} className="text-sm text-gold">
          ← {backLabel}
        </Link>
        <div className="flex gap-3">
          {payUrl && (
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm rounded-lg bg-gold/20 text-gold px-3 py-1.5 border border-gold/30"
            >
              M-Pesa Pay
            </a>
          )}
          <PrintButton />
        </div>
      </div>
      <DocumentPrintView doc={doc} payUrl={payUrl} />
    </>
  );
}
