/** Shared webhook handling: verify with the provider's own signature scheme, dedupe, then apply after responding. */
import "server-only";
import { NextResponse, after } from "next/server";
import { redis } from "@/lib/db";
import { applyProviderTx, getOrder, orderByProviderId } from "./orders";
import type { Onramp } from "./types";

export async function handleWebhook(provider: Onramp, req: Request) {
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const v = provider.verifyWebhook(raw, req.headers);
  if (!v) return NextResponse.json({ error: "signature" }, { status: 401 });
  if ("ignore" in v) return NextResponse.json({ ok: true });
  const first = await redis<string | null>("SET", `wh:${provider.id}:${v.event}`, "1", "NX", "EX", 7 * 86400).catch(() => "OK");
  if (!first) return NextResponse.json({ ok: true, duplicate: true });
  after(async () => {
    const o = (v.tx.extId ? await getOrder(v.tx.extId) : null) ?? (v.tx.providerId ? await orderByProviderId(provider.id, v.tx.providerId) : null);
    if (o && o.provider.toLowerCase() === provider.id) await applyProviderTx(o, v.tx);
  });
  return NextResponse.json({ ok: true });
}
