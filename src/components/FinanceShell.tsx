"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Receipt, LogOut, Shield, GitBranch, BarChart3, BookOpen, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { SessionTimeoutGuard } from "@/components/SessionTimeoutGuard";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports & graphs", icon: BarChart3 },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/workflows", label: "Client workflows", icon: GitBranch },
  { href: "/failed", label: "Failed deliveries", icon: AlertTriangle },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/security", label: "Security", icon: Shield },
];
export function FinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <SessionTimeoutGuard />
      <aside className="no-print w-64 shrink-0 border-r border-border bg-deep-blue p-4">
        <div className="mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
          <Image
            src="/logo.png"
            alt="TechFlare Solutions"
            width={96}
            height={32}
            unoptimized
            className="h-8 w-auto object-contain bg-transparent shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-gold text-sm truncate">TechFlare Finance</p>
            <p className="text-[10px] text-muted truncate">Treasury Department</p>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                pathname.startsWith(href) ? "bg-gold/15 text-gold" : "text-muted hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="mt-8 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
