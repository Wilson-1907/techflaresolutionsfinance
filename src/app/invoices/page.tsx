import { DocumentListClient } from "@/components/DocumentListClient";

export default function InvoicesPage() {
  return (
    <DocumentListClient
      docType="invoice"
      title="Invoices"
      newHref="/invoices/new"
      detailBase="/invoices"
    />
  );
}
