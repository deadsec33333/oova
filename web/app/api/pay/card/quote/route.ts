import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { allow } from "@/lib/db";
import { cardOffer, payerIp } from "@/lib/onramp/offer";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };

/** Public and read only: can this payer pay this link by card, and the provider's live quote. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ip = payerIp(req);
  const who = createHash("sha256").update(ip || "anon").digest("hex").slice(0, 24);
  try { if (!(await allow(`cq:${who}`, 40, 60))) return NextResponse.json({ available: false, reason: "slow_down" }, { status: 429, headers: noStore }); } catch { /* limiter down */ }
  const o = await cardOffer({ to: u.searchParams.get("to") ?? "", amount: u.searchParams.get("amount") ?? "", ref: u.searchParams.get("ref") ?? "", fiat: u.searchParams.get("fiat") ?? undefined, ip, country: req.headers.get("x-vercel-ip-country") ?? "" });
  if (!o.available) return NextResponse.json(o, { headers: noStore });
  const q = o.quote;
  return NextResponse.json({
    available: true, provider: o.provider, terms: o.terms, privacy: o.privacy, note: o.note, needsEmail: o.needsEmail, fiats: o.fiats, country: o.country, fiat: o.fiat,
    youPay: q.youPay, price: q.price, providerFee: q.providerFee, networkFee: q.networkFee, ourFee: 0,
    receiverGets: o.link.amount, minUsdc: o.minUsdc, maxUsdc: o.maxUsdc, expiresAt: q.expiresAt,
  }, { headers: noStore });
}
