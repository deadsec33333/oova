/** Can this payer pay this link by card right now, and for how much? Shared by the quote and session routes. */
import "server-only";
import { createHash } from "node:crypto";
import { redis } from "@/lib/db";
import { cardAccepted, getLinkByRef, type LinkRec } from "@/lib/links";
import { isSolanaAddress, parseAmount } from "@/lib/solanapay";
import { onramp } from "./orders";
import type { Quote } from "./types";

const EEA = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO".split(" "));
export const FIATS = ["usd", "eur", "gbp"] as const;
export type Fiat = (typeof FIATS)[number];

export type Offer =
  | { available: true; link: LinkRec; provider: string; terms: string; privacy: string; country: string; fiat: Fiat; quote: Quote; minUsdc: number | null; maxUsdc: number | null }
  | { available: false; reason: "off_platform" | "invalid" | "not_saved" | "paid" | "off" | "region" | "min" | "max" | "provider_down"; country?: string; minUsdc?: number; maxUsdc?: number; provider?: string };

export function payerIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
}

async function cached<T>(k: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try { const hit = await redis<string | null>("GET", k); if (hit) return JSON.parse(hit) as T; } catch { /* no cache */ }
  const v = await fn();
  try { await redis("SET", k, JSON.stringify(v), "EX", ttl); } catch { /* ignore */ }
  return v;
}

export async function cardOffer(p: { to: string; amount: string; ref: string; fiat?: string; ip: string }): Promise<Offer> {
  if (!onramp.configured()) return { available: false, reason: "off_platform" };
  const amount = parseAmount(p.amount);
  if (!amount || !isSolanaAddress(p.to) || !isSolanaAddress(p.ref)) return { available: false, reason: "invalid" };
  const link = await getLinkByRef(p.ref);
  if (!link || link.to !== p.to || link.amount !== amount) return { available: false, reason: "not_saved" };
  if (link.status === "paid") return { available: false, reason: "paid" };
  if (!cardAccepted(link)) return { available: false, reason: "off" };

  try {
    let country = "";
    if (p.ip) {
      const ipKey = createHash("sha256").update(p.ip).digest("hex").slice(0, 24);
      const region = await cached(`mp:ip:${ipKey}`, 600, () => onramp.region(p.ip));
      country = region.country;
      if (!region.allowed) return { available: false, reason: "region", country, provider: onramp.name };
    }
    const auto: Fiat = EEA.has(country) ? "eur" : country === "GB" ? "gbp" : "usd";
    const fiat: Fiat = (FIATS as readonly string[]).includes(p.fiat ?? "") ? (p.fiat as Fiat) : auto;
    const lim = await cached(`mp:lim:${fiat}`, 3600, () => onramp.limits(fiat));
    const n = Number(amount);
    if (lim.minUsdc && n < lim.minUsdc) return { available: false, reason: "min", minUsdc: lim.minUsdc, country, provider: onramp.name };
    if (lim.maxUsdc && n > lim.maxUsdc) return { available: false, reason: "max", maxUsdc: lim.maxUsdc, country, provider: onramp.name };
    const quote = await cached(`mp:q:${fiat}:${amount}`, 20, () => onramp.quote(amount, fiat));
    return { available: true, link, provider: onramp.name, terms: onramp.termsUrl, privacy: onramp.privacyUrl, country, fiat, quote, minUsdc: lim.minUsdc, maxUsdc: lim.maxUsdc };
  } catch {
    return { available: false, reason: "provider_down", provider: onramp.name };
  }
}
