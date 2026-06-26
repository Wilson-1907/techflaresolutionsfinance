import { DocumentListClient } from "@/components/DocumentListClient";

export default function ReceiptsPage() {
  return (
    <DocumentListClient
      docType="receipt"
      title="Receipts"
      newHref="/receipts/new"
      detailBase="/receipts"
    />
  );
}
