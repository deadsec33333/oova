import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { allow } from "@/lib/db";
import { attachProviderId, getOrder, refreshOrder } from "@/lib/onramp/orders";
import { providerOf } from "@/lib/onramp/providers";
import { payerIp } from "@/lib/onramp/offer";

export const dynamic = "force-dynamic";

/** Public and read only: where a card checkout stands. Asks the provider at most every 10 s as a webhook fallback. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("o") ?? "";
  const pid = u.searchParams.get("pid") ?? "";
  const who = createHash("sha256").update(payerIp(req) || "anon").digest("hex").slice(0, 24);
  try { if (!(await allow(`cst:${who}`, 60, 60))) return NextResponse.json({ status: "slow_down" }, { status: 429 }); } catch { /* limiter down */ }
  let o = await getOrder(id);
  if (!o) return NextResponse.json({ status: "not_found" }, { status: 404 });
  if (pid) o = await attachProviderId(o, pid);
  o = await refreshOrder(o);
  return NextResponse.json({
    status: o.status, amount: o.amount, to: o.to, provider: providerOf(o.provider).name, fiat: o.fiat,
    txHash: o.txHash ?? null, received: o.received ?? null, failure: o.failure ?? null, updatedAt: o.updatedAt,
  }, { headers: { "cache-control": "no-store" } });
}
