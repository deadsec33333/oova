import "server-only";
import { rpc } from "@/lib/rpc";
import { USDC_MINT } from "@/lib/solanapay";

type Sig = { signature: string; err: unknown; blockTime: number | null };
type TokBal = { mint: string; owner?: string; uiTokenAmount: { amount: string } };
type Tx = { meta: { err: unknown; preTokenBalances?: TokBal[]; postTokenBalances?: TokBal[] } | null; blockTime: number | null; transaction: { message: { accountKeys: { pubkey: string; signer: boolean }[] } } };

export type PaidResult = { status: "paid"; signature: string; payer: string | null; blockTime: number | null; exact: boolean };
export type CheckResult = PaidResult | { status: "pending" };

const toRaw = (amt: string) => { const [i, f = ""] = amt.split("."); return BigInt(i) * 1_000_000n + BigInt((f + "000000").slice(0, 6)); };
const bal = (list: TokBal[] | undefined, owner: string) => (list ?? []).filter((b) => b.mint === USDC_MINT && b.owner === owner).reduce((s, b) => s + BigInt(b.uiTokenAmount.amount), 0n);

/**
 * Has this pay link been paid? Looks up the link's random reference key on Solana,
 * then checks the transaction really moved at least the USDC amount to the receiver.
 * Read only. Never signs or moves anything.
 */
export async function checkPayment(to: string, amount: string, ref: string): Promise<CheckResult> {
  const sigs = await rpc<Sig[]>("getSignaturesForAddress", [ref, { limit: 10, commitment: "confirmed" }]);
  const want = toRaw(amount);
  for (const s of sigs.filter((x) => !x.err)) {
    const tx = await rpc<Tx | null>("getTransaction", [s.signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }]);
    if (!tx?.meta || tx.meta.err) continue;
    const got = bal(tx.meta.postTokenBalances, to) - bal(tx.meta.preTokenBalances, to);
    if (got >= want) {
      const payer = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey ?? null;
      return { status: "paid", signature: s.signature, payer, blockTime: tx.blockTime ?? s.blockTime, exact: got === want };
    }
  }
  return { status: "pending" };
}

/**
 * How much USDC a known transaction delivered to `to`. Used for card payments, where the provider
 * sends the USDC and tells us the transaction id. Read only. "retry" when the RPC could not answer,
 * null when the transaction is not visible (or failed) on chain yet.
 */
export async function verifyTransfer(signature: string, to: string): Promise<{ received: bigint; blockTime: number | null } | null | "retry"> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,100}$/.test(signature)) return null;
  let tx: Tx | null;
  try {
    tx = await rpc<Tx | null>("getTransaction", [signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }]);
  } catch { return "retry"; }
  if (!tx?.meta || tx.meta.err) return null;
  const received = bal(tx.meta.postTokenBalances, to) - bal(tx.meta.preTokenBalances, to);
  return received > 0n ? { received, blockTime: tx.blockTime } : null;
}
