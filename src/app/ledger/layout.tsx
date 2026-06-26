import { FinanceShell } from "@/components/FinanceShell";

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <FinanceShell>{children}</FinanceShell>;
}
