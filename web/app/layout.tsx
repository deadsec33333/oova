import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(host.startsWith("localhost") ? `http://${host}` : `https://${host}`),
  title: "QOVA · Dollars for everyone, one link away",
  description: "Send a link. Anyone pays it. You get the exact amount in USDC on Solana, wallet to wallet.",
  openGraph: { title: "QOVA", description: "Dollars for everyone, one link away.", type: "website" },
  twitter: { card: "summary_large_image", title: "QOVA", description: "Dollars for everyone, one link away." },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
