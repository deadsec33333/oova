export type TxStatus = "pending" | "processing" | "completed" | "failed";

/** A provider transaction, reduced to what QOVA needs. No card or identity data. */
export type ProviderTx = {
  providerId: string; extId: string; status: TxStatus; rawStatus: string;
  /** The wallet the provider says it pays. Empty when the provider does not report it (the on chain check still decides). */
  wallet: string;
  currency: string; txHash: string | null; updatedAt: string;
  failure?: string; fiat?: string; fiatTotal?: number;
};

export type Quote = {
  fiat: string; youPay: number; price: number; providerFee: number; networkFee: number; partnerFee: number;
  receiverGets: string; expiresAt: string | null;
};
export type Region = { allowed: boolean; country: string; countryName: string };
export type Limits = { minUsdc: number | null; maxUsdc: number | null; minFiat: number | null; maxFiat: number | null };

export type ProviderId = "moonpay" | "coinflow";

export type Onramp = {
  id: ProviderId;
  name: string;
  /** Where the provider delivers USDC right now: devnet in sandboxes that settle test USDC. */
  network: () => "mainnet" | "devnet";
  termsUrl: string;
  privacyUrl: string;
  /** Fiat currencies the payer can pick. */
  fiats: readonly string[];
  /** The checkout needs the payer's email up front (passed to the provider, never stored by QOVA). */
  needsEmail: boolean;
  /** One line for the payer about what the provider will ask. */
  payerNote: string;
  configured: () => boolean;
  /** Payer's IP and the country our host detected (x-vercel-ip-country). */
  region: (ip: string, country: string) => Promise<Region>;
  limits: (fiat: string) => Promise<Limits>;
  /** Extra checks for this link before offering card (amount format, receiver wallet ready). Returns a reason code or null. */
  precheck?: (p: { amount: string; to: string }) => Promise<string | null>;
  quote: (amount: string, fiat: string, to: string) => Promise<Quote>;
  checkout: (o: { orderId: string; wallet: string; amount: string; fiat: string; ip: string; email?: string; returnUrl: string; theme: "light" | "dark" }) => Promise<string>;
  /** Look up an order at the provider. providerId is the provider's own id when we already know it. */
  fetchTx: (o: { id: string; providerId?: string }) => Promise<ProviderTx | null>;
  verifyWebhook: (raw: string, headers: Headers) => null | { ignore: true } | { event: string; tx: ProviderTx };
};

/** Our own record of a card checkout. Lives in Redis as order:<id>. */
export type OrderStatus = "created" | "pending" | "processing" | "paid" | "failed" | "underpaid";
export type CardOrder = {
  id: string; provider: string; linkId: string; to: string; amount: string; fiat: string;
  status: OrderStatus; createdAt: number; updatedAt: number;
  providerId?: string; providerStatus?: string; providerUpdatedAt?: string;
  txHash?: string; received?: string; failure?: string; checkedAt?: number;
};
