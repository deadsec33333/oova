import { NextResponse } from "next/server";
import { allow, redis } from "@/lib/db";
import { rpc } from "@/lib/rpc";
import { currentWallet } from "@/lib/session";
import { USDC_MINT } from "@/lib/solanapay";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };
const TTL = 30;

type Acct = { account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string } } } } } };

/** Format raw USDC units (6 decimals) as a plain decimal string. */
const fmt = (raw: bigint) => {
  const s = raw.toString().padStart(7, "0");
  return `${s.slice(0, -6)}.${s.slice(-6)}`.replace(/(\.\d{2}\d*?)0+$/, "$1");
};

/**
 * The signed in wallet's USDC balance on Solana. Read only, server side (the RPC key never
 * reaches the browser), cached for about 30 seconds and rate limited. Never moves anything.
 */
export async function GET() {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  const key = `bal:${wallet}`;

  try {
    const hit = await redis<string | null>("GET", key);
    if (hit) return NextResponse.json({ ...(JSON.parse(hit) as object), cached: true }, { headers: noStore });
  } catch { /* no cache, carry on */ }

  try {
    if (!(await allow(`bal:${wallet}`, 20, 60))) return NextResponse.json({ error: "slow_down" }, { status: 429, headers: noStore });
  } catch { /* limiter down: still bounded by the cache */ }

  if (!process.env.SOLANA_RPC) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: noStore });
  try {
    const r = await rpc<{ value: Acct[] }>("getTokenAccountsByOwner", [wallet, { mint: USDC_MINT }, { encoding: "jsonParsed", commitment: "confirmed" }]);
    const raw = (r?.value ?? []).reduce((s, a) => {
      const info = a.account?.data?.parsed?.info;
      return info?.mint === USDC_MINT ? s + BigInt(info.tokenAmount?.amount ?? "0") : s;
    }, 0n);
    const body = { usdc: fmt(raw), at: Date.now() };
    try { await redis("SET", key, JSON.stringify(body), "EX", TTL); } catch { /* ignore */ }
    return NextResponse.json(body, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "rpc" }, { status: 502, headers: noStore });
  }
}
