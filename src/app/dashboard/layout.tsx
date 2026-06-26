import { FinanceShell } from "@/components/FinanceShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <FinanceShell>{children}</FinanceShell>;
}
