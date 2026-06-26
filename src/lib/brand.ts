export const financeBrand = {
  company: "TECHFLARE",
  companyFull: "TechFlare Solutions",
  slogan: "IGNITING INNOVATIONS, DELIVERING SOLUTIONS",
  treasuryName: "Kinyanjui Wilson",
  treasuryTitle: "Treasury Department · TechFlare Solutions",
  treasurySignature: "Authorized by Treasury Dept.",
  issuerPhone: "+254117880494",
  issuerEmail: "stechflare@gmail.com",
};

export type FinanceLineItem = {
  description: string;
  qty: number;
  unitPrice: number;
  total?: number;
};

export function calcTotals(lineItems: FinanceLineItem[], taxRate = 0) {
  const items = lineItems.map((item) => ({
    ...item,
    qty: Math.max(1, Number(item.qty) || 1),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    total: Math.max(1, Number(item.qty) || 1) * Math.max(0, Number(item.unitPrice) || 0),
  }));
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = subtotal * (Math.max(0, taxRate) / 100);
  return { lineItems: items, subtotal, taxAmount, total: subtotal + taxAmount };
}

export function calcSplits(total: number, splits: { party: string; percent: number }[]) {
  if (!splits.length) return [];
  const sum = splits.reduce((s, x) => s + x.percent, 0) || 100;
  return splits.map((s) => ({
    ...s,
    amount: Math.round((total * (s.percent / sum)) * 100) / 100,
  }));
}

export function formatMoney(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
