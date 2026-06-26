"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Receipt,
  Plus,
  ChevronRight,
  Loader2,
  BarChart3,
  BookOpen,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/brand";
import { formatDocDate, lineItemPreview, type DocumentSummary } from "@/lib/finance-doc";

type ReportSummary = {
  summary: {
    revenue: number;
    income: number;
    moneyOut: number;
    profit: number;
    outstandingInvoices: number;
  };
};

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<DocumentSummary[]>([]);
  const [receipts, setReceipts] = useState<DocumentSummary[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      fetch("/api/documents?type=invoice").then((r) => (r.ok ? r.json() : { documents: [] })),
      fetch("/api/documents?type=receipt").then((r) => (r.ok ? r.json() : { documents: [] })),
      fetch(`/api/reports?from=${year}-01-01&to=${year}-12-31`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([inv, rec, rep]) => {
        setInvoices(inv.documents ?? []);
        setReceipts(rec.documents ?? []);
        setReport(rep);
      })
      .finally(() => setLoading(false));
  }, []);

  const recent = [...invoices, ...receipts]
    .sort((a, b) => new Date(b.docDate || 0).getTime() - new Date(a.docDate || 0).getTime())
    .slice(0, 6);

  const s = report?.summary;

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Treasury Dashboard</h1>
      <p className="text-muted text-sm mb-6">Financial overview — reports and ledger update automatically.</p>

      {s && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/reports" className="rounded-2xl border border-gold/30 bg-gold/5 p-5 hover:border-gold/50 transition-colors">
            <TrendingUp className="h-6 w-6 text-life-green mb-2" />
            <p className="text-xl font-bold">{formatMoney(s.income)}</p>
            <p className="text-xs text-muted">Income (cash in) · Reports</p>
          </Link>
          <Link href="/reports" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-gold/40 transition-colors">
            <Receipt className="h-6 w-6 text-gold mb-2" />
            <p className="text-xl font-bold">{formatMoney(s.revenue)}</p>
            <p className="text-xs text-muted">Revenue (invoiced)</p>
          </Link>
          <Link href="/ledger" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-gold/40 transition-colors">
            <Wallet className="h-6 w-6 text-red-400 mb-2" />
            <p className="text-xl font-bold">{formatMoney(s.moneyOut)}</p>
            <p className="text-xs text-muted">Money out · Ledger</p>
          </Link>
          <Link href="/reports" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-gold/40 transition-colors">
            <BarChart3 className="h-6 w-6 text-gold mb-2" />
            <p className={`text-xl font-bold ${s.profit >= 0 ? "text-life-green" : "text-red-400"}`}>
              {formatMoney(s.profit)}
            </p>
            <p className="text-xs text-muted">Net profit</p>
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/reports" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm text-gold">
          <BarChart3 className="h-4 w-4" /> Financial reports & graphs
        </Link>
        <Link href="/ledger" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm text-gold">
          <BookOpen className="h-4 w-4" /> Money in / out ledger
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/invoices"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-gold/40 hover:bg-gold/5 transition-colors"
        >
          <FileText className="h-8 w-8 text-gold mb-3" />
          <p className="text-3xl font-bold">{loading ? "—" : invoices.length}</p>
          <p className="text-sm text-muted">Invoices · View all</p>
        </Link>
        <Link
          href="/receipts"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-gold/40 hover:bg-gold/5 transition-colors"
        >
          <Receipt className="h-8 w-8 text-gold mb-3" />
          <p className="text-3xl font-bold">{loading ? "—" : receipts.length}</p>
          <p className="text-sm text-muted">Receipts · View all</p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-medium text-black">
          <Plus className="h-4 w-4" /> New Invoice
        </Link>
        <Link href="/receipts/new" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm text-gold">
          <Plus className="h-4 w-4" /> New Receipt
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent documents</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : recent.length === 0 ? (
        <p className="text-sm text-muted">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {recent.map((d) => {
            const base = d.docType === "receipt" ? "/receipts" : "/invoices";
            return (
              <Link
                key={d.id}
                href={`${base}/${d.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-gold/40"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase text-muted">{d.docType}</p>
                  <p className="font-medium text-gold">{d.number}</p>
                  <p className="text-sm truncate">{d.clientName} · {lineItemPreview(d, 40)}</p>
                  <p className="text-xs text-muted">{formatDocDate(d.docDate)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{formatMoney(d.total, d.currency)}</span>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-gold" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
