/**
 * MoonPay adapter. Server only: the secret and webhook keys never reach the browser.
 * QOVA never sees card data or funds. MoonPay runs the checkout, the payer's KYC and the
 * transfer, and sends USDC straight to the receiver's own wallet.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Onramp, ProviderTx, Quote, Region, Limits, TxStatus } from "./types";

const env = (k: string) => process.env[k]?.trim() || "";
const pk = () => env("MOONPAY_PUBLISHABLE_KEY");
const sk = () => env("MOONPAY_SECRET_KEY");
const whk = () => env("MOONPAY_WEBHOOK_KEY");
const api = () => env("MOONPAY_API_BASE") || "https://api.moonpay.com";
/** The coin MoonPay delivers: USDC on Solana. Overridable in case MoonPay's code differs on the account. */
export const MOONPAY_CURRENCY = () => env("MOONPAY_CURRENCY_CODE") || "usdc_sol";
const widgetBase = () => env("MOONPAY_WIDGET_BASE") || (pk().startsWith("pk_live_") ? "https://buy.moonpay.com" : "https://buy-sandbox.moonpay.com");

async function get<T>(path: string, params: Record<string, string>): Promise<{ ok: boolean; status: number; json: T | null }> {
  const u = new URL(api().replace(/\/$/, "") + path);
  for (const [k, v] of Object.entries({ apiKey: pk(), ...params })) u.searchParams.set(k, v);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(u, { cache: "no-store", signal: ctrl.signal, headers: { accept: "application/json" } });
    return { ok: r.ok, status: r.status, json: (await r.json().catch(() => null)) as T | null };
  } finally { clearTimeout(t); }
}

const MAP: Record<string, TxStatus> = { waitingPayment: "pending", waitingAuthorization: "pending", pending: "processing", completed: "completed", failed: "failed" };

type MpTx = {
  id: string; status: string; updatedAt?: string; createdAt?: string; walletAddress?: string; cryptoTransactionId?: string | null;
  quoteCurrencyAmount?: number | null; baseCurrencyAmount?: number | null; feeAmount?: number | null; networkFeeAmount?: number | null; extraFeeAmount?: number | null;
  externalTransactionId?: string | null; failureReason?: string | null; currency?: { code?: string } | null; baseCurrency?: { code?: string } | null;
};

function toTx(t: MpTx): ProviderTx {
  return {
    providerId: t.id,
    extId: t.externalTransactionId ?? "",
    status: MAP[t.status] ?? "pending",
    rawStatus: t.status,
    wallet: t.walletAddress ?? "",
    currency: t.currency?.code ?? "",
    txHash: t.cryptoTransactionId || null,
    updatedAt: t.updatedAt ?? t.createdAt ?? new Date().toISOString(),
    failure: t.failureReason ?? undefined,
    fiat: t.baseCurrency?.code ?? undefined,
    fiatTotal: t.baseCurrencyAmount != null ? Number(t.baseCurrencyAmount) + Number(t.feeAmount ?? 0) + Number(t.networkFeeAmount ?? 0) + Number(t.extraFeeAmount ?? 0) : undefined,
  };
}

/** HMAC SHA256 over the query string (with its leading "?"), standard base64, as MoonPay documents. */
function sign(search: string) { return createHmac("sha256", sk()).update(search).digest("base64"); }

export const moonpay: Onramp = {
  id: "moonpay",
  name: "MoonPay",
  network: () => "mainnet",
  fiats: ["usd", "eur", "gbp"],
  needsEmail: false,
  payerNote: "MoonPay handles your card and may ask for ID.",
  termsUrl: "https://www.moonpay.com/legal/terms_of_use",
  privacyUrl: "https://www.moonpay.com/legal/privacy_policy",
  configured: () => Boolean(pk() && sk() && whk()),

  async region(ip: string, country: string): Promise<Region> {
    if (!ip) return { allowed: true, country, countryName: "" };
    const r = await get<{ alpha2?: string; country?: string; isBuyAllowed?: boolean; isAllowed?: boolean }>("/v3/ip_address", { ipAddress: ip });
    if (!r.ok || !r.json) throw new Error("provider_region");
    return { allowed: r.json.isBuyAllowed !== false && r.json.isAllowed !== false, country: r.json.alpha2 ?? "", countryName: r.json.country ?? "" };
  },

  async limits(fiat: string): Promise<Limits> {
    const r = await get<{ baseCurrency?: { minBuyAmount?: number; maxBuyAmount?: number }; quoteCurrency?: { minBuyAmount?: number; maxBuyAmount?: number } }>(
      `/v3/currencies/${MOONPAY_CURRENCY()}/limits`, { baseCurrencyCode: fiat, paymentMethod: "credit_debit_card" });
    if (!r.ok || !r.json) throw new Error("provider_limits");
    return {
      minUsdc: r.json.quoteCurrency?.minBuyAmount ?? null, maxUsdc: r.json.quoteCurrency?.maxBuyAmount ?? null,
      minFiat: r.json.baseCurrency?.minBuyAmount ?? null, maxFiat: r.json.baseCurrency?.maxBuyAmount ?? null,
    };
  },

  async quote(amount: string, fiat: string, _to: string): Promise<Quote> {
    void _to;
    const r = await get<{ baseCurrencyAmount: number; quoteCurrencyAmount: number; feeAmount: number; networkFeeAmount: number; extraFeeAmount?: number; totalAmount: number; expiresAt?: string }>(
      `/v3/currencies/${MOONPAY_CURRENCY()}/buy_quote`, { baseCurrencyCode: fiat, quoteCurrencyAmount: amount, paymentMethod: "credit_debit_card", areFeesIncluded: "false" });
    if (!r.ok || !r.json || typeof r.json.totalAmount !== "number") throw new Error(r.status === 400 ? "provider_amount" : "provider_quote");
    const q = r.json;
    return {
      fiat, youPay: q.totalAmount, price: q.baseCurrencyAmount, providerFee: q.feeAmount, networkFee: q.networkFeeAmount,
      partnerFee: q.extraFeeAmount ?? 0, receiverGets: String(q.quoteCurrencyAmount), expiresAt: q.expiresAt ?? null,
    };
  },

  /** A signed checkout link with the receiver's wallet and the USDC amount set by us, not the payer. */
  async checkout({ orderId, wallet, amount, fiat, ip, returnUrl, theme }) {
    const p = new URLSearchParams();
    p.set("apiKey", pk());
    p.set("currencyCode", MOONPAY_CURRENCY()); // payer cannot switch coin
    p.set("walletAddress", wallet); // hidden by default when valid; shown read only below
    p.set("showWalletAddressForm", "true"); // payer sees where it goes but "cannot modify it"
    p.set("quoteCurrencyAmount", amount);
    p.set("baseCurrencyCode", fiat);
    p.set("externalTransactionId", orderId);
    p.set("redirectURL", returnUrl);
    p.set("theme", theme);
    if (ip) p.set("allowedIpAddress", createHmac("sha256", sk()).update(ip).digest("base64"));
    const search = "?" + p.toString();
    return `${widgetBase()}${search}&signature=${encodeURIComponent(sign(search))}`;
  },

  async fetchTx({ id: orderId }): Promise<ProviderTx | null> {
    const r = await get<MpTx | MpTx[]>(`/v1/transactions/ext/${encodeURIComponent(orderId)}`, {});
    if (r.status === 404) return null;
    if (!r.ok || !r.json) throw new Error("provider_status");
    const list = Array.isArray(r.json) ? r.json : [r.json];
    if (!list.length) return null;
    // newest update wins
    const t = list.sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""))[0];
    return toTx(t);
  },

  /** Moonpay-Signature-V2: t=<unix>,s=<hex HMAC SHA256 of "t.body" with the webhook key>. */
  verifyWebhook(raw: string, headers: Headers) {
    const header = headers.get("moonpay-signature-v2");
    if (!header || !whk()) return null;
    const parts = Object.fromEntries(header.split(",").map((x) => { const i = x.indexOf("="); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
    const t = Number(parts.t), s = parts.s ?? "";
    if (!t || !/^[0-9a-f]{64}$/i.test(s)) return null;
    if (Math.abs(Date.now() / 1000 - t) > 15 * 60) return null; // stale or replayed
    const want = createHmac("sha256", whk()).update(`${t}.${raw}`).digest();
    const got = Buffer.from(s, "hex");
    if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
    try {
      const body = JSON.parse(raw) as { type?: string; data?: MpTx };
      if (!body.data?.id || !body.type?.startsWith("transaction_")) return { ignore: true as const };
      return { event: `${body.type}:${body.data.id}:${body.data.updatedAt ?? ""}:${body.data.status}`, tx: toTx(body.data) };
    } catch { return null; }
  },
};
