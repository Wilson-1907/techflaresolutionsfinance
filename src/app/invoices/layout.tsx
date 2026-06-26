import { FinanceShell } from "@/components/FinanceShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <FinanceShell>{children}</FinanceShell>;
}
