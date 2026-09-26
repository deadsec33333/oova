import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QOVA",
  description: "Dollars for everyone, one link away.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#070B14" }}>{children}</body>
    </html>
  );
}
