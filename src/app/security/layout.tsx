import { FinanceShell } from "@/components/FinanceShell";

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <FinanceShell>{children}</FinanceShell>;
}
