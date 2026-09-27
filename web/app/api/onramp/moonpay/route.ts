import { NextResponse, after } from "next/server";
import { redis } from "@/lib/db";
import { moonpay } from "@/lib/onramp/moonpay";
import { applyProviderTx, getOrder } from "@/lib/onramp/orders";

export const dynamic = "force-dynamic";

/**
 * MoonPay webhooks. Protected by the signature only (no cookies, no origin): anything without a valid
 * Moonpay-Signature-V2 is refused. Answers fast, then does the Solana check after the response.
 * Duplicates and out of order events are safe.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const v = moonpay.verifyWebhook(raw, req.headers.get("moonpay-signature-v2"));
  if (!v) return NextResponse.json({ error: "signature" }, { status: 401 });
  if ("ignore" in v) return NextResponse.json({ ok: true });
  const first = await redis<string | null>("SET", `wh:${v.event}`, "1", "NX", "EX", 7 * 86400).catch(() => "OK");
  if (!first) return NextResponse.json({ ok: true, duplicate: true });
  after(async () => {
    const o = v.tx.extId ? await getOrder(v.tx.extId) : null;
    if (o) await applyProviderTx(o, v.tx);
  });
  return NextResponse.json({ ok: true });
}
