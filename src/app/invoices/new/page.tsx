import { DocumentForm } from "@/components/DocumentForm";

export default function NewInvoicePage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">New Invoice</h1>
      <DocumentForm docType="invoice" />
    </>
  );
}
