import { NextResponse } from "next/server";
import { checkPayment } from "@/lib/paycheck";
import { isSolanaAddress, parseAmount } from "@/lib/solanapay";

export const dynamic = "force-dynamic";

/** Public, read only: has this pay link been paid? */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ref = u.searchParams.get("ref") ?? "";
  const to = u.searchParams.get("to") ?? "";
  const amount = parseAmount(u.searchParams.get("amount") ?? "");
  if (!isSolanaAddress(ref) || !isSolanaAddress(to) || !amount) return NextResponse.json({ status: "invalid" }, { status: 400 });
  if (!process.env.SOLANA_RPC) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  try {
    return NextResponse.json(await checkPayment(to, amount, ref), { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
