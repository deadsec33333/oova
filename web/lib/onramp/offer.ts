/** Can this payer pay this link by card right now, and for how much? Shared by the quote and session routes. */
import "server-only";
import { createHash } from "node:crypto";
import { redis } from "@/lib/db";
import { cardAccepted, getLinkByRef, type LinkRec } from "@/lib/links";
import { isSolanaAddress, parseAmount } from "@/lib/solanapay";
import { activeOnramp } from "./providers";
import type { Quote } from "./types";

const EEA = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO".split(" "));
export const FIATS = ["usd", "eur", "gbp"] as const;
export type Fiat = (typeof FIATS)[number];

export type Offer =
  | { available: true; link: LinkRec; provider: string; terms: string; privacy: string; note: string; needsEmail: boolean; fiats: readonly string[]; country: string; fiat: Fiat; quote: Quote; minUsdc: number | null; maxUsdc: number | null }
  | { available: false; reason: "off_platform" | "invalid" | "not_saved" | "paid" | "off" | "region" | "min" | "max" | "cents" | "no_usdc_account" | "provider_amount" | "provider_down"; country?: string; minUsdc?: number; maxUsdc?: number; provider?: string };

export function payerIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
}

async function cached<T>(k: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try { const hit = await redis<string | null>("GET", k); if (hit) return JSON.parse(hit) as T; } catch { /* no cache */ }
  const v = await fn();
  try { await redis("SET", k, JSON.stringify(v), "EX", ttl); } catch { /* ignore */ }
  return v;
}

export async function cardOffer(p: { to: string; amount: string; ref: string; fiat?: string; ip: string; country?: string }): Promise<Offer> {
  const onramp = activeOnramp();
  if (!onramp.configured()) return { available: false, reason: "off_platform" };
  const amount = parseAmount(p.amount);
  if (!amount || !isSolanaAddress(p.to) || !isSolanaAddress(p.ref)) return { available: false, reason: "invalid" };
  const link = await getLinkByRef(p.ref);
  if (!link || link.to !== p.to || link.amount !== amount) return { available: false, reason: "not_saved" };
  if (link.status === "paid") return { available: false, reason: "paid" };
  if (!cardAccepted(link)) return { available: false, reason: "off" };

  try {
    let country = (p.country ?? "").toUpperCase();
    if (p.ip || country) {
      const ipKey = createHash("sha256").update(`${p.ip}|${country}`).digest("hex").slice(0, 24);
      const region = await cached(`${onramp.id}:ip:${ipKey}`, 600, () => onramp.region(p.ip, country));
      country = region.country || country;
      if (!region.allowed) return { available: false, reason: "region", country, provider: onramp.name };
    }
    if (onramp.precheck) {
      const why = await onramp.precheck({ amount, to: link.to });
      if (why) return { available: false, reason: why as "cents" | "no_usdc_account", country, provider: onramp.name };
    }
    const allowed = onramp.fiats as readonly string[];
    const auto = (EEA.has(country) && allowed.includes("eur") ? "eur" : country === "GB" && allowed.includes("gbp") ? "gbp" : "usd") as Fiat;
    const fiat: Fiat = allowed.includes(p.fiat ?? "") ? (p.fiat as Fiat) : auto;
    const lim = await cached(`${onramp.id}:lim:${fiat}`, 3600, () => onramp.limits(fiat));
    const n = Number(amount);
    if (lim.minUsdc && n < lim.minUsdc) return { available: false, reason: "min", minUsdc: lim.minUsdc, country, provider: onramp.name };
    if (lim.maxUsdc && n > lim.maxUsdc) return { available: false, reason: "max", maxUsdc: lim.maxUsdc, country, provider: onramp.name };
    const quote = await cached(`${onramp.id}:q:${fiat}:${amount}:${link.to}`, 20, () => onramp.quote(amount, fiat, link.to));
    // Never offer a checkout that would deliver less than the link asks for.
    if (Number(quote.receiverGets) + 1e-9 < n) return { available: false, reason: "provider_amount", country, provider: onramp.name };
    return { available: true, link, provider: onramp.name, terms: onramp.termsUrl, privacy: onramp.privacyUrl, note: onramp.payerNote, needsEmail: onramp.needsEmail, fiats: onramp.fiats, country, fiat, quote, minUsdc: lim.minUsdc, maxUsdc: lim.maxUsdc };
  } catch (e) {
    console.error(`[card] ${onramp.id} offer failed: ${(e as Error).message}`);
    return { available: false, reason: "provider_down", provider: onramp.name };
  }
}
