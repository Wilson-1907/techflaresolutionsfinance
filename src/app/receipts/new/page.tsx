import { ReceiptVerifyForm } from "@/components/ReceiptVerifyForm";

export default function NewReceiptPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Issue receipt</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Verify the client&apos;s M-Pesa code against the invoice, then generate and send the signed receipt.
      </p>
      <ReceiptVerifyForm />
    </>
  );
}
