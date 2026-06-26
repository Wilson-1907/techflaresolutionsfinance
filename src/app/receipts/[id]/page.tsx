import { DocumentDetailClient } from "@/components/DocumentDetailClient";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DocumentDetailClient
      id={id}
      docType="receipt"
      backHref="/receipts"
      backLabel="Receipts"
    />
  );
}
