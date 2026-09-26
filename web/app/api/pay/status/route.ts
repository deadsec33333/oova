import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";
import { USDC_MINT, isSolanaAddress, parseAmount } from "@/lib/solanapay";

export const dynamic = "force-dynamic";

type Sig = { signature: string; err: unknown; blockTime: number | null };
type TokBal = { mint: string; owner?: string; uiTokenAmount: { amount: string } };
type Tx = { meta: { err: unknown; preTokenBalances?: TokBal[]; postTokenBalances?: TokBal[] } | null; blockTime: number | null; transaction: { message: { accountKeys: { pubkey: string; signer: boolean }[] } } };

const toRaw = (amt: string) => { const [i, f = ""] = amt.split("."); return BigInt(i) * 1_000_000n + BigInt((f + "000000").slice(0, 6)); };
const bal = (list: TokBal[] | undefined, owner: string) => (list ?? []).filter((b) => b.mint === USDC_MINT && b.owner === owner).reduce((s, b) => s + BigInt(b.uiTokenAmount.amount), 0n);

/**
 * Has this pay link been paid? Looks up the link's random reference key on Solana,
 * then checks the transaction really moved the exact USDC amount to the receiver.
 * Read only. Never signs or moves anything.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ref = u.searchParams.get("ref") ?? "";
  const to = u.searchParams.get("to") ?? "";
  const amount = parseAmount(u.searchParams.get("amount") ?? "");
  if (!isSolanaAddress(ref) || !isSolanaAddress(to) || !amount) return NextResponse.json({ status: "invalid" }, { status: 400 });
  if (!process.env.SOLANA_RPC) return NextResponse.json({ status: "unavailable" }, { status: 503 });

  try {
    const sigs = await rpc<Sig[]>("getSignaturesForAddress", [ref, { limit: 10, commitment: "confirmed" }]);
    const want = toRaw(amount);
    for (const s of sigs.filter((x) => !x.err)) {
      const tx = await rpc<Tx | null>("getTransaction", [s.signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }]);
      if (!tx?.meta || tx.meta.err) continue;
      const got = bal(tx.meta.postTokenBalances, to) - bal(tx.meta.preTokenBalances, to);
      if (got >= want) {
        const payer = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey ?? null;
        return NextResponse.json(
          { status: "paid", signature: s.signature, payer, blockTime: tx.blockTime ?? s.blockTime, exact: got === want },
          { headers: { "cache-control": "no-store" } }
        );
      }
    }
    return NextResponse.json({ status: "pending" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
