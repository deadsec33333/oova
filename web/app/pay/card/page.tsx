import type { Metadata } from "next";
import Logo from "@/components/Logo";
import CardReturn from "@/components/CardReturn";

export const metadata: Metadata = { title: "Card payment · QOVA", robots: { index: false } };
type SP = Promise<Record<string, string | string[] | undefined>>;

/** Where MoonPay sends the payer back after checkout. */
export default async function CardReturnPage({ searchParams }: { searchParams: SP }) {
  const p = await searchParams;
  const o = Array.isArray(p.o) ? p.o[0] : p.o;
  return (
    <main className="pay">
      <div className="pay-sky" aria-hidden="true" />
      <div className="pay-card">
        <a href="/" className="brand"><Logo /></a>
        <CardReturn order={o ?? ""} />
      </div>
    </main>
  );
}
