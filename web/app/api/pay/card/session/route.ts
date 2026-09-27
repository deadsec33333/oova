import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { allow } from "@/lib/db";
import { sameOrigin } from "@/lib/session";
import { cardOffer, payerIp } from "@/lib/onramp/offer";
import { createOrder } from "@/lib/onramp/orders";
import { activeOnramp } from "@/lib/onramp/providers";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };

/**
 * Start a card checkout for a pay link. The wallet and the USDC amount come from the saved link,
 * never from the payer, and the checkout URL is signed so they cannot be changed.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { to?: string; amount?: string; ref?: string; fiat?: string; theme?: string; email?: string };
  const ip = payerIp(req);
  const who = createHash("sha256").update(ip || "anon").digest("hex").slice(0, 24);
  try {
    if (!(await allow(`cs:${who}`, 10, 60)) || !(await allow(`csl:${body.ref ?? ""}`, 20, 3600)))
      return NextResponse.json({ error: "slow_down" }, { status: 429, headers: noStore });
  } catch { /* limiter down */ }
  const o = await cardOffer({ to: body.to ?? "", amount: body.amount ?? "", ref: body.ref ?? "", fiat: body.fiat, ip, country: req.headers.get("x-vercel-ip-country") ?? "" });
  if (!o.available) return NextResponse.json({ error: o.reason, ...o }, { status: 400, headers: noStore });
  // Email only when the provider needs it for the receipt; passed straight to them, never stored by QOVA.
  const email = (body.email ?? "").trim().slice(0, 200);
  const onramp = activeOnramp();
  if (onramp.needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "email" }, { status: 400, headers: noStore });
  const order = await createOrder(o.link, o.fiat);
  const origin = new URL(req.url).origin;
  try {
    const url = await onramp.checkout({
      orderId: order.id, wallet: o.link.to, amount: o.link.amount, fiat: o.fiat, ip, email: onramp.needsEmail ? email : undefined,
      returnUrl: `${origin}/pay/card?o=${order.id}`, theme: body.theme === "dark" ? "dark" : "light",
    });
    return NextResponse.json({ url, order: order.id }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "provider_down" }, { status: 502, headers: noStore });
  }
}
