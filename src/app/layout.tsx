import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Finance | TechFlare Solutions",
    template: "%s | TechFlare Solutions",
  },
  description: "Treasury — invoices, receipts, and financial operations for TechFlare Solutions.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "TechFlare Solutions Finance",
    description: "IGNITING INNOVATIONS, DELIVERING SOLUTIONS",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
