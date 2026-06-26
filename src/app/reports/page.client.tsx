"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Wallet, Receipt, PiggyBank, Users } from "lucide-react";
import { formatMoney } from "@/lib/brand";

type Report = {
  summary: {
    revenue: number;
    income: number;
    expenses: number;
    salaries: number;
    investmentOut: number;
    investmentIn: number;
    moneyIn: number;
    moneyOut: number;
    profit: number;
    outstandingInvoices: number;
    outstandingCount: number;
  };
  monthly: Array<{
    month: string;
    revenue: number;
    income: number;
    expense: number;
    salary: number;
    investment: number;
    moneyIn: number;
    moneyOut: number;
    profit: number;
  }>;
  byCategory: Array<{ category: string; moneyIn: number; moneyOut: number; net: number }>;
};

const PIE_COLORS = ["#d4af37", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#f97316"];

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <Icon className={`h-6 w-6 mb-2 ${accent ?? "text-gold"}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    setLoading(true);
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!report) {
    return <p className="text-muted">Could not load financial reports.</p>;
  }

  const { summary, monthly, byCategory } = report;

  const cashFlowData = monthly.map((m) => ({
    name: m.month.slice(5),
    "Money in": m.moneyIn,
    "Money out": m.moneyOut,
    Profit: m.profit,
  }));

  const breakdownData = monthly.map((m) => ({
    name: m.month.slice(5),
    Revenue: m.revenue,
    Income: m.income,
    Expenses: m.expense,
    Salaries: m.salary,
    Investment: m.investment,
  }));

  const pieData = [
    { name: "Income", value: summary.income },
    { name: "Expenses", value: summary.expenses },
    { name: "Salaries", value: summary.salaries },
    { name: "Investment", value: summary.investmentOut },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Financial Reports</h1>
          <p className="text-sm text-muted">
            Automatic ledger — money in and out from invoices, M-Pesa, payroll, expenses, and investments.
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Revenue (invoiced)" value={formatMoney(summary.revenue)} icon={Receipt} />
        <KpiCard label="Income (cash in)" value={formatMoney(summary.income)} icon={TrendingUp} accent="text-life-green" />
        <KpiCard label="Money out" value={formatMoney(summary.moneyOut)} icon={TrendingDown} accent="text-red-400" />
        <KpiCard
          label="Net profit"
          value={formatMoney(summary.profit)}
          icon={Wallet}
          accent={summary.profit >= 0 ? "text-life-green" : "text-red-400"}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Expenditures" value={formatMoney(summary.expenses)} icon={PiggyBank} />
        <KpiCard label="Salaries paid" value={formatMoney(summary.salaries)} icon={Users} />
        <KpiCard label="Investment (out)" value={formatMoney(summary.investmentOut)} icon={TrendingDown} />
        <KpiCard
          label="Outstanding invoices"
          value={formatMoney(summary.outstandingInvoices)}
          icon={Receipt}
          accent="text-amber-400"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-4">Cash flow — money in vs out</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => formatMoney(Number(v ?? 0))}
                contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20" }}
              />
              <Legend />
              <Bar dataKey="Money in" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Money out" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-4">Profit trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => formatMoney(Number(v ?? 0))}
                contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20" }}
              />
              <Line type="monotone" dataKey="Profit" stroke="#d4af37" strokeWidth={2} dot={{ fill: "#d4af37" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-4">Revenue, income, expenses & salaries</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => formatMoney(Number(v ?? 0))}
                contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20" }}
              />
              <Legend />
              <Bar dataKey="Revenue" stackId="a" fill="#d4af37" />
              <Bar dataKey="Income" stackId="b" fill="#22c55e" />
              <Bar dataKey="Expenses" stackId="c" fill="#ef4444" />
              <Bar dataKey="Salaries" stackId="c" fill="#f97316" />
              <Bar dataKey="Investment" stackId="c" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {pieData.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold mb-4">Year breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {byCategory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-8">
          <h2 className="font-semibold mb-4">By category</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-left border-b border-white/10">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Money in</th>
                  <th className="py-2 pr-4">Money out</th>
                  <th className="py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((row) => (
                  <tr key={row.category} className="border-b border-white/5">
                    <td className="py-2 pr-4 capitalize">{row.category.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-4 text-life-green">{formatMoney(row.moneyIn)}</td>
                    <td className="py-2 pr-4 text-red-400">{formatMoney(row.moneyOut)}</td>
                    <td className={`py-2 ${row.net >= 0 ? "text-life-green" : "text-red-400"}`}>
                      {formatMoney(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Reports sync automatically from invoices, receipts, M-Pesa payments, and product orders. Record expenses,
        salaries, and investments in the Ledger page.
      </p>
    </div>
  );
}
