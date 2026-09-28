/**
 * Coinflow adapter: the payer makes a normal card, Apple Pay or Google Pay purchase (no crypto account),
 * and Coinflow settles USDC on Solana straight to the receiver's wallet for that payment
 * ("USDC settlement to a third party wallet": settlementType USDC + destinationAuthKey).
 * Server only. QOVA never sees card data and never holds the funds.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redis } from "@/lib/db";
import { rpc } from "@/lib/rpc";
import { USDC_MINT } from "@/lib/solanapay";
import type { Onramp, ProviderTx, Quote, Region, Limits, TxStatus } from "./types";

const env = (k: string) => process.env[k]?.trim() || "";
const key = () => env("COINFLOW_API_KEY");
const merchant = () => env("COINFLOW_MERCHANT_ID");
const whk = () => env("COINFLOW_WEBHOOK_KEY");
const prod = () => env("COINFLOW_ENV") === "prod";
const api = () => (env("COINFLOW_API_BASE") || (prod() ? "https://api.coinflow.cash/api" : "https://api-sandbox.coinflow.cash/api")).replace(/\/$/, "");

/** Card payer countries from Coinflow's supported countries page (27 Sep 2026). Kenya is not on it. */
const COUNTRIES = new Set((
  "AS AG AR AW BS BB BZ BM BO BR CA KY CL CO CR DM DO EC SV GF GL GD GU GT HT HN JM MX MP PA PY PE PR BL KN LC VC SR TT TC US UY " +
  "AL AD FI GE IS IM LI MD MC ME NO SM CH TR GB FO JE GG " +
  "AT BE BG HR CY CZ DK EE FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE " +
  "BH IL JO KW OM QA SA AE " +
  "AM AU AZ BD BT BN CK FJ PF HK IN ID JP KZ KI KG LA MO MY MV MH FM MN NR NP NZ NU PW PG PH WS SG SB KR LK TW TJ TH TL TO TM TV UZ VU VN " +
  "AO BJ BW BF CV CM TD KM CI DJ EG GQ SZ GA GM GH GN GW LS LR MG MW ML MR MU YT MA MZ NA NG RW ST SN SC SL ZA TZ TG EH"
).split(" "));

async function call<T>(method: "GET" | "POST", path: string, opts: { body?: unknown; headers?: Record<string, string> } = {}): Promise<{ ok: boolean; status: number; json: T | null }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(api() + path, {
      method, cache: "no-store", signal: ctrl.signal,
      headers: { accept: "application/json", ...(opts.body ? { "content-type": "application/json" } : {}), ...opts.headers },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    return { ok: r.ok, status: r.status, json: (await r.json().catch(() => null)) as T | null };
  } finally { clearTimeout(t); }
}

type CurrencyCents = { cents: number; currency?: string };
type TotalsBlock = { subtotal?: CurrencyCents; creditCardFees?: CurrencyCents; chargebackProtectionFees?: CurrencyCents; gasFees?: CurrencyCents; fxFees?: CurrencyCents; networkFees?: CurrencyCents; payInFees?: CurrencyCents; total?: CurrencyCents; settlement?: { subtotal?: CurrencyCents } };
const c = (x?: CurrencyCents) => (x?.cents ?? 0) / 100;
const toCents = (amount: string) => { const [i, f = ""] = amount.split("."); return Number(i) * 100 + Number((f + "00").slice(0, 2)); };

/** A short lived key tying USDC settlement for one payment to the receiver's wallet. Cached per wallet. */
async function destinationAuthKey(wallet: string): Promise<string> {
  const k = `cf:dak:${wallet}`;
  try { const hit = await redis<string | null>("GET", k); if (hit) return hit; } catch { /* no cache */ }
  const r = await call<{ destinationAuthKey?: string }>("POST", "/checkout/destination-auth-key", { headers: { Authorization: key() }, body: { destination: wallet, blockchain: "solana" } });
  if (!r.ok || !r.json?.destinationAuthKey) throw new Error("provider_destination");
  try { await redis("SET", k, r.json.destinationAuthKey, "EX", 1800); } catch { /* ignore */ }
  return r.json.destinationAuthKey;
}

/** Our Coinflow merchant id: COINFLOW_MERCHANT_ID if set, otherwise read once from Coinflow with the API key. */
async function merchantId(): Promise<string> {
  if (merchant()) return merchant();
  try { const hit = await redis<string | null>("GET", "cf:mid"); if (hit) return hit; } catch { /* no cache */ }
  const r = await call<{ merchantId?: string }>("GET", "/merchant", { headers: { Authorization: key() } });
  if (!r.ok || !r.json?.merchantId) throw new Error("provider_merchant");
  try { await redis("SET", "cf:mid", r.json.merchantId, "EX", 86400); } catch { /* ignore */ }
  return r.json.merchantId;
}

async function sessionKey(userId: string): Promise<string> {
  const k = `cf:sk:${userId}`;
  try { const hit = await redis<string | null>("GET", k); if (hit) return hit; } catch { /* no cache */ }
  const r = await call<{ key?: string }>("GET", "/auth/session-key", { headers: { Authorization: key(), "x-coinflow-auth-user-id": userId } });
  if (!r.ok || !r.json?.key) throw new Error("provider_session");
  try { await redis("SET", k, r.json.key, "EX", 20 * 60); } catch { /* ignore */ }
  return r.json.key;
}

const EV: Record<string, TxStatus> = {
  "Card Payment Authorized": "processing", "Payment Authorized": "processing", "Payment Pending Review": "pending",
  "Settled": "completed", "Disbursed Funds": "completed",
  "Card Payment Declined": "failed", "Card Payment Suspected Fraud": "failed", "Card Payment Voided": "failed", "Payment Expiration": "failed",
};

type Packet = { eventType?: string; created?: string; data?: { id?: string; paymentId?: string; signature?: string; webhookInfo?: { qovaOrder?: string } | null; declineDescription?: string; reasonMessage?: string } };

export const coinflow: Onramp = {
  id: "coinflow",
  name: "Coinflow",
  network: () => (prod() ? "mainnet" : "devnet"),
  termsUrl: "https://coinflow.cash/legal/terms-of-service",
  privacyUrl: "https://coinflow.cash/legal/privacy-policy",
  fiats: ["usd"],
  needsEmail: true,
  payerNote: "A normal card payment. No crypto account needed.",
  configured: () => Boolean(key() && whk()),

  async region(_ip: string, country: string): Promise<Region> {
    void _ip;
    if (!country) return { allowed: true, country: "", countryName: "" }; // host did not say; let Coinflow decide at checkout
    return { allowed: COUNTRIES.has(country.toUpperCase()), country: country.toUpperCase(), countryName: "" };
  },

  async limits(): Promise<Limits> {
    // Coinflow publishes no general minimum or maximum; its checkout enforces its own.
    return { minUsdc: null, maxUsdc: null, minFiat: null, maxFiat: null };
  },

  async precheck({ amount, to }) {
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return "cents"; // card amounts are whole cents
    // Coinflow sends USDC to the wallet's USDC account, which must already exist.
    // Sandbox settles test USDC on devnet, where most wallets have no account yet: let Coinflow try.
    if (!prod()) return null;
    const k = `cf:ata:${to}`;
    try { if (await redis<string | null>("GET", k)) return null; } catch { /* no cache */ }
    const r = await rpc<{ value: unknown[] }>("getTokenAccountsByOwner", [to, { mint: USDC_MINT }, { encoding: "jsonParsed", commitment: "confirmed" }]);
    if (!r?.value?.length) return "no_usdc_account";
    try { await redis("SET", k, "1", "EX", 3600); } catch { /* ignore */ }
    return null;
  },

  async quote(amount: string, fiat: string, to: string): Promise<Quote> {
    const sk = await sessionKey("qova-quote");
    const dak = await destinationAuthKey(to);
    const r = await call<{ card?: TotalsBlock }>("POST", `/checkout/totals/${encodeURIComponent(await merchantId())}`, {
      headers: { "x-coinflow-auth-session-key": sk },
      body: { subtotal: { cents: toCents(amount), currency: "USD" }, settlementType: "USDC", destinationAuthKey: dak },
    });
    const t = r.json?.card;
    if (!r.ok || !t?.total) throw new Error("provider_quote");
    const settled = t.settlement?.subtotal ?? t.subtotal;
    return {
      fiat, youPay: c(t.total), price: c(t.subtotal),
      providerFee: c(t.creditCardFees) + c(t.chargebackProtectionFees) + c(t.fxFees) + c(t.payInFees),
      networkFee: c(t.gasFees) + c(t.networkFees), partnerFee: 0,
      receiverGets: (c(settled)).toFixed(2), expiresAt: null,
    };
  },

  async checkout({ orderId, wallet, amount, ip, email, returnUrl }) {
    const dak = await destinationAuthKey(wallet);
    const body: Record<string, unknown> = {
      subtotal: { cents: toCents(amount), currency: "USD" },
      email,
      blockchain: "solana",
      settlementType: "USDC",
      destinationAuthKey: dak,
      webhookInfo: { qovaOrder: orderId },
      idempotencyKey: orderId,
      allowedPaymentMethods: ["card", "applePay", "googlePay"],
      chargebackProtectionAccountType: "guest",
      chargebackProtectionData: [{
        itemClass: "crypto", id: orderId, units: amount, cryptoCurrency: "USDC",
        unitPrice: { currency: "USD", valueInCurrency: 1 },
        recipientInfo: { accountId: wallet, wallet: { address: wallet, blockchain: "SOL", custodialType: "nonCustodial" } },
      }],
    };
    if (ip) body.standaloneLinkConfig = { callbackUrl: returnUrl, endUserDeviceIpAddress: ip };
    const r = await call<{ link?: string }>("POST", "/checkout/link", { headers: { Authorization: key(), "x-coinflow-auth-user-id": orderId }, body });
    if (!r.ok || !r.json?.link) throw new Error("provider_checkout");
    return r.json.link;
  },

  async fetchTx({ id, providerId }): Promise<ProviderTx | null> {
    if (!providerId) return null; // Coinflow is looked up by its payment id, learned from a webhook or the return redirect
    const r = await call<{ paymentId?: string; signature?: string; error?: string; webhookInfo?: { qovaOrder?: string }; createdAt?: string }>(
      "GET", `/merchant/payments/${encodeURIComponent(providerId)}`, { headers: { Authorization: key() } });
    if (r.status === 404) return null;
    if (!r.ok || !r.json) throw new Error("provider_status");
    const p = r.json;
    if (p.webhookInfo?.qovaOrder && p.webhookInfo.qovaOrder !== id) return null; // not ours
    const status: TxStatus = p.signature ? "completed" : p.error ? "failed" : "processing";
    return { providerId, extId: id, status, rawStatus: p.signature ? "settled" : p.error ? "error" : "processing", wallet: "", currency: "USDC", txHash: p.signature ?? null, updatedAt: new Date().toISOString(), failure: p.error };
  },

  /** Coinflow-Signature: t=<unix>,v1=<hex HMAC SHA256 of "t.rawBody" with the webhook validation key>. */
  verifyWebhook(raw: string, headers: Headers) {
    if (!whk()) return null;
    const sig = headers.get("coinflow-signature");
    let ok = false;
    if (sig) {
      const parts = Object.fromEntries(sig.split(",").map((x) => { const i = x.indexOf("="); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
      const t = Number(parts.t), v1 = parts.v1 ?? "";
      if (t && /^[0-9a-f]{64}$/i.test(v1) && Math.abs(Date.now() / 1000 - t) <= 15 * 60) {
        const want = createHmac("sha256", whk()).update(`${t}.${raw}`).digest();
        const got = Buffer.from(v1, "hex");
        ok = got.length === want.length && timingSafeEqual(got, want);
      }
    } else {
      // Older setting: the Authorization header carries the validation key itself.
      const a = Buffer.from(headers.get("authorization") ?? ""), b = Buffer.from(whk());
      ok = a.length === b.length && timingSafeEqual(a, b);
    }
    if (!ok) return null;
    try {
      const p = JSON.parse(raw) as Packet;
      const status = p.eventType ? EV[p.eventType] : undefined;
      const pid = p.data?.paymentId ?? p.data?.id;
      if (!status || !pid) return { ignore: true as const };
      return {
        event: `${p.eventType}:${pid}:${p.created ?? ""}`,
        tx: {
          providerId: pid, extId: p.data?.webhookInfo?.qovaOrder ?? "", status, rawStatus: p.eventType!, wallet: "", currency: "USDC",
          txHash: status === "completed" ? p.data?.signature ?? null : null, updatedAt: p.created ?? new Date().toISOString(),
          failure: status === "failed" ? p.data?.declineDescription || p.data?.reasonMessage || "The card payment did not go through" : undefined,
        },
      };
    } catch { return null; }
  },
};
