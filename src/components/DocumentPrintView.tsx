"use client";

import Image from "next/image";
import { financeBrand, formatMoney, type FinanceLineItem } from "@/lib/brand";
import { formatDocDate } from "@/lib/finance-doc";

export type FinanceDoc = {
  id: string;
  docType: string;
  number: string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  lineItems: FinanceLineItem[];
  splits?: { party: string; percent: number; amount: number }[] | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientRole?: string | null;
  clientAddress?: string | null;
  issuerName: string;
  issuerTitle: string;
  invoiceRef?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  docDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
};

export function DocumentPrintView({ doc, payUrl }: { doc: FinanceDoc; payUrl?: string }) {
  const title = doc.docType === "invoice" ? "INVOICE" : "RECEIPT";
  const lineItems = (doc.lineItems ?? []) as FinanceLineItem[];

  return (
    <div className="print-doc mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white text-black p-8 sm:p-10 shadow-xl">
      <div className="flex justify-between gap-6 border-b-4 border-[#c9a227] pb-6 mb-6">
        <div>
          <Image
            src="/logo.png"
            alt={`${financeBrand.companyFull} — ${financeBrand.slogan}`}
            width={140}
            height={46}
            unoptimized
            className="h-12 w-auto mb-2 object-contain bg-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">{financeBrand.treasuryTitle}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold">{title}</h2>
          {doc.docType === "invoice" && (
            <p className="text-sm text-gray-600 mt-2">
              Invoice #: <strong>{doc.number}</strong>
            </p>
          )}
          {doc.docType === "receipt" && (
            <>
              <p className="text-sm text-gray-600 mt-2">
                Receipt #: <strong>{doc.number}</strong>
              </p>
              {doc.invoiceRef && (
                <p className="text-sm text-gray-600">
                  For invoice: <strong>{doc.invoiceRef}</strong>
                </p>
              )}
            </>
          )}
          <p className="text-sm text-gray-600">
            Date: <strong>{formatDocDate(doc.docDate)}</strong>
          </p>
          {doc.docType === "invoice" && doc.dueDate && (
            <p className="text-sm text-gray-600">
              Due: <strong>{formatDocDate(doc.dueDate)}</strong>
            </p>
          )}
          {doc.docType === "receipt" && doc.paidAt && (
            <p className="text-sm text-gray-600">
              Paid: <strong>{formatDocDate(doc.paidAt)}</strong>
            </p>
          )}
          <p className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase text-gray-700">
            {doc.status}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-[#c9a227] mb-1">{doc.docType === "receipt" ? "Received From" : "Bill To"}</p>
          <p className="font-semibold">{doc.clientName}</p>
          {doc.clientRole && <p className="text-gray-600">{doc.clientRole}</p>}
          {doc.clientPhone && <p className="text-gray-600">{doc.clientPhone}</p>}
          {doc.clientEmail && <p className="text-gray-600">{doc.clientEmail}</p>}
          {doc.clientAddress && <p className="text-gray-600 whitespace-pre-wrap">{doc.clientAddress}</p>}
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#c9a227] mb-1">Issued By</p>
          <p className="font-semibold">{doc.issuerName}</p>
          <p className="text-gray-600">{doc.issuerTitle}</p>
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left text-xs uppercase text-gray-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Unit</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">No line items recorded</td>
            </tr>
          ) : (
            lineItems.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 pr-2">{item.description}</td>
                <td className="py-2 text-center">{item.qty}</td>
                <td className="py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                <td className="py-2 text-right">{(item.total ?? item.qty * item.unitPrice).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(doc.subtotal, doc.currency)}</span></div>
        {doc.taxRate > 0 && (
          <div className="flex justify-between"><span>Tax ({doc.taxRate}%)</span><span>{formatMoney(doc.taxAmount, doc.currency)}</span></div>
        )}
        <div className="flex justify-between font-bold text-base border-t-2 border-[#c9a227] pt-2 mt-2">
          <span>Total</span><span>{formatMoney(doc.total, doc.currency)}</span>
        </div>
      </div>

      {doc.splits && doc.splits.length > 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 text-sm">
          <p className="font-semibold mb-2">Payment Division</p>
          {doc.splits.map((s) => (
            <div key={s.party} className="flex justify-between text-gray-700">
              <span>{s.party} ({s.percent}%)</span>
              <span>{formatMoney(s.amount, doc.currency)}</span>
            </div>
          ))}
        </div>
      )}

      {doc.paymentMethod && (
        <p className="mt-4 text-sm text-gray-600">Payment: {doc.paymentMethod}</p>
      )}

      {doc.docType === "invoice" && doc.status !== "paid" && payUrl && (
        <div className="mt-6 rounded-lg border border-[#c9a227] bg-amber-50 p-4 text-sm no-print">
          <p className="font-semibold text-[#c9a227] mb-1">Pay with M-Pesa</p>
          <p className="text-gray-700 mb-2">Till <strong>9356451</strong> · TechFlare Solutions</p>
          <a href={payUrl} className="inline-block rounded-lg bg-[#c9a227] px-4 py-2 text-white font-medium hover:opacity-90">
            Pay {formatMoney(doc.total, doc.currency)} online
          </a>
        </div>
      )}

      <div className="mt-10 grid sm:grid-cols-2 gap-8 pt-6 border-t border-dashed border-gray-300 text-sm">
        <div>
          <div className="border-t border-gray-800 pt-2 mt-8">
            <p className="font-semibold">{doc.issuerName}</p>
            <p className="text-gray-600">{financeBrand.treasuryTitle}</p>
            <p className="text-xs italic text-[#c9a227] mt-1">{financeBrand.treasurySignature}</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-800 pt-2 mt-8">
            <p className="font-semibold">{doc.clientName}</p>
            <p className="text-gray-600">Client</p>
          </div>
        </div>
      </div>

      {doc.notes && <p className="mt-6 text-xs text-gray-500 text-center">{doc.notes}</p>}
    </div>
  );
}
