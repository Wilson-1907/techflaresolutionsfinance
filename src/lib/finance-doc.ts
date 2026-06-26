import type { FinanceLineItem } from "@/lib/brand";
import type { FinanceDoc } from "@/components/DocumentPrintView";

export type DocumentSummary = {
  id: string;
  docType: string;
  number: string;
  clientName: string;
  total: number;
  status: string;
  currency: string;
  docDate?: string;
  invoiceRef?: string | null;
  lineItems?: FinanceLineItem[];
};

function parseLineItems(value: unknown): FinanceLineItem[] {
  let items = value;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    description: String(item?.description ?? ""),
    qty: Number(item?.qty) || 1,
    unitPrice: Number(item?.unitPrice) || 0,
    total: item?.total != null ? Number(item.total) : undefined,
  }));
}

export function normalizeFinanceDoc(raw: Record<string, unknown>): FinanceDoc {
  const lineItems = parseLineItems(raw.lineItems);
  let splits = raw.splits;
  if (typeof splits === "string") {
    try {
      splits = JSON.parse(splits);
    } catch {
      splits = null;
    }
  }

  return {
    id: String(raw.id ?? ""),
    docType: String(raw.docType ?? "invoice"),
    number: String(raw.number ?? ""),
    status: String(raw.status ?? "draft"),
    currency: String(raw.currency ?? "KES"),
    subtotal: Number(raw.subtotal) || 0,
    taxRate: Number(raw.taxRate) || 0,
    taxAmount: Number(raw.taxAmount) || 0,
    total: Number(raw.total) || 0,
    lineItems,
    splits: Array.isArray(splits) ? (splits as FinanceDoc["splits"]) : null,
    clientName: String(raw.clientName ?? ""),
    clientEmail: (raw.clientEmail as string | null) ?? null,
    clientPhone: (raw.clientPhone as string | null) ?? null,
    clientRole: (raw.clientRole as string | null) ?? null,
    clientAddress: (raw.clientAddress as string | null) ?? null,
    issuerName: String(raw.issuerName ?? ""),
    issuerTitle: String(raw.issuerTitle ?? ""),
    invoiceRef: (raw.invoiceRef as string | null) ?? null,
    paymentMethod: (raw.paymentMethod as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    docDate: String(raw.docDate ?? new Date().toISOString()),
    dueDate: (raw.dueDate as string | null) ?? null,
    paidAt: (raw.paidAt as string | null) ?? null,
  };
}

export function formatDocDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function lineItemPreview(doc: DocumentSummary, max = 60) {
  const items = parseLineItems(doc.lineItems);
  if (!items.length) return "No line items";
  const text = items.map((i) => i.description).filter(Boolean).join(" · ");
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
