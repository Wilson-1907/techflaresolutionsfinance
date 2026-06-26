import { DocumentDetailClient } from "@/components/DocumentDetailClient";

const MAIN_SITE = process.env.MAIN_FRONTEND_URL?.trim()
  || process.env.NEXT_PUBLIC_MAIN_FRONTEND_URL?.trim()
  || "https://techflaresolutionss.vercel.app";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DocumentDetailClient
      id={id}
      docType="invoice"
      backHref="/invoices"
      backLabel="Invoices"
      payBaseUrl={MAIN_SITE.replace(/\/$/, "")}
    />
  );
}
