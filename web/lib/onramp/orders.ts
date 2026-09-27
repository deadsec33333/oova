/**
 * Card orders: our record of each card checkout, and the one place that decides a card payment is Paid.
 * A payment only counts after we see the USDC land in the receiver's wallet on Solana ourselves.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { redis } from "@/lib/db";
import { getLinkById, saveLink, type LinkRec } from "@/lib/links";
import { verifyTransfer } from "@/lib/paycheck";
import { activeOnramp, providerOf } from "./providers";
import type { CardOrder, OrderStatus, ProviderTx } from "./types";
const key = (id: string) => `order:${id}`;
const TTL = 120 * 86400;
export const FINAL: OrderStatus[] = ["paid", "failed", "underpaid"];

export const newOrderId = () => "q" + randomBytes(12).toString("base64url");

export async function getOrder(id: string): Promise<CardOrder | null> {
  if (!/^q[A-Za-z0-9_-]{16}$/.test(id)) return null;
  const raw = await redis<string | null>("GET", key(id));
  try { return raw ? (JSON.parse(raw) as CardOrder) : null; } catch { return null; }
}
export async function saveOrder(o: CardOrder) { await redis("SET", key(o.id), JSON.stringify(o), "EX", TTL); }

/** Keep a short summary of the latest checkouts on the link, for the dashboard. */
async function noteOnLink(l: LinkRec, o: CardOrder) {
  const rest = (l.cardOrders ?? []).filter((x) => x.id !== o.id);
  l.cardOrders = [{ id: o.id, status: o.status, at: o.updatedAt }, ...rest].slice(0, 5);
  await saveLink(l, false);
}

export async function createOrder(l: LinkRec, fiat: string): Promise<CardOrder> {
  const now = Date.now();
  const o: CardOrder = { id: newOrderId(), provider: activeOnramp().id, linkId: l.id, to: l.to, amount: l.amount, fiat, status: "created", createdAt: now, updatedAt: now };
  await saveOrder(o);
  await noteOnLink(l, o);
  return o;
}

const toRaw = (amt: string) => { const [i, f = ""] = amt.split("."); return BigInt(i) * 1_000_000n + BigInt((f + "000000").slice(0, 6)); };
const fromRaw = (r: bigint) => { const s = r.toString().padStart(7, "0"); return `${s.slice(0, -6)}.${s.slice(-6)}`.replace(/\.?0+$/, ""); };

/**
 * Apply what the provider says about an order. Idempotent: replays and out of order updates are safe.
 * Completed orders are checked on Solana before the link is marked Paid.
 */
export async function applyProviderTx(o: CardOrder, tx: ProviderTx): Promise<CardOrder> {
  if (FINAL.includes(o.status)) return o;
  if (o.providerUpdatedAt && Date.parse(tx.updatedAt) < Date.parse(o.providerUpdatedAt)) return o; // older news
  if (tx.extId && tx.extId !== o.id) return o;
  if (tx.providerId && tx.providerId !== o.providerId) await redis("SET", `opay:${o.provider}:${tx.providerId}`, o.id, "EX", TTL);
  o.providerId = tx.providerId; o.providerStatus = tx.rawStatus; o.providerUpdatedAt = tx.updatedAt; o.updatedAt = Date.now();

  // The provider must be sending to the link's wallet. Anything else is never counted.
  if (tx.wallet && tx.wallet !== o.to) { o.status = "failed"; o.failure = "Sent to a different wallet"; }
  else if (tx.status === "failed") { o.status = "failed"; o.failure = tx.failure || "The card payment did not go through"; }
  else if (tx.status === "completed" && tx.txHash) {
    const v = await verifyTransfer(tx.txHash, o.to);
    if (v === "retry") { o.status = "processing"; }
    else if (v === null) { o.status = "processing"; o.failure = undefined; } // not visible on chain yet
    else {
      const want = toRaw(o.amount);
      // one on chain transfer can pay one link, once
      const fresh = await redis<string | null>("SET", `paidsig:${tx.txHash}`, o.id, "NX", "EX", 365 * 86400);
      const owner = fresh ? o.id : await redis<string | null>("GET", `paidsig:${tx.txHash}`);
      if (owner !== o.id) { o.status = "failed"; o.failure = "Transaction already used"; }
      else if (v.received >= want) {
        o.status = "paid"; o.txHash = tx.txHash; o.received = fromRaw(v.received);
        const l = await getLinkById(o.linkId);
        if (l && l.to === o.to && l.status !== "paid") {
          l.status = "paid";
          l.paid = { signature: tx.txHash, payer: null, blockTime: v.blockTime, exact: v.received === want, method: "card", provider: providerOf(o.provider).name, orderId: o.id };
          await noteOnLink(l, o);
          await saveOrder(o);
          return o;
        }
      } else { o.status = "underpaid"; o.txHash = tx.txHash; o.received = fromRaw(v.received); }
    }
  } else if (tx.status === "completed") { o.status = "processing"; }
  else { o.status = tx.status === "processing" ? "processing" : "pending"; }

  await saveOrder(o);
  const l = await getLinkById(o.linkId);
  if (l) await noteOnLink(l, o);
  return o;
}

/** Fallback when a webhook is late or lost: ask the provider directly, at most every 10 s per order. */
export async function refreshOrder(o: CardOrder, force = false): Promise<CardOrder> {
  if (FINAL.includes(o.status)) return o;
  if (!force && o.checkedAt && Date.now() - o.checkedAt < 10_000) return o;
  o.checkedAt = Date.now();
  await saveOrder(o);
  try {
    const tx = await providerOf(o.provider).fetchTx({ id: o.id, providerId: o.providerId });
    if (tx) return await applyProviderTx(o, tx);
  } catch { /* provider down: try again next round */ }
  return o;
}

/** Pending card orders on a link, refreshed. Used by the site wide watcher through /check. */
export async function refreshLinkOrders(l: LinkRec): Promise<void> {
  const live = (l.cardOrders ?? []).filter((x) => !FINAL.includes(x.status as OrderStatus) && Date.now() - x.at < 3 * 86400_000).slice(0, 3);
  for (const x of live) { const o = await getOrder(x.id); if (o) await refreshOrder(o); }
}

/** Find our order from a provider payment id (Coinflow's later events carry only their id). */
export async function orderByProviderId(provider: string, providerId: string): Promise<CardOrder | null> {
  const id = await redis<string | null>("GET", `opay:${provider}:${providerId}`);
  return id ? getOrder(id) : null;
}

/** Learn the provider's payment id from the return redirect, after checking it belongs to this order. */
export async function attachProviderId(o: CardOrder, providerId: string): Promise<CardOrder> {
  if (o.providerId || !/^[A-Za-z0-9_-]{6,80}$/.test(providerId)) return o;
  try {
    const tx = await providerOf(o.provider).fetchTx({ id: o.id, providerId });
    if (tx) return await applyProviderTx(o, tx);
  } catch { /* try later */ }
  return o;
}
