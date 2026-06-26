"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-gold px-4 py-2 text-sm font-medium text-black"
    >
      Print / PDF
    </button>
  );
}
