export type TxStatus = "pending" | "processing" | "completed" | "failed";

/** A provider transaction, reduced to what QOVA needs. No card or identity data. */
export type ProviderTx = {
  providerId: string; extId: string; status: TxStatus; rawStatus: string;
  wallet: string; currency: string; txHash: string | null; updatedAt: string;
  failure?: string; fiat?: string; fiatTotal?: number;
};

export type Quote = {
  fiat: string; youPay: number; price: number; providerFee: number; networkFee: number; partnerFee: number;
  receiverGets: string; expiresAt: string | null;
};
export type Region = { allowed: boolean; country: string; countryName: string };
export type Limits = { minUsdc: number | null; maxUsdc: number | null; minFiat: number | null; maxFiat: number | null };

export type Onramp = {
  name: string;
  termsUrl: string;
  privacyUrl: string;
  configured: () => boolean;
  region: (ip: string) => Promise<Region>;
  limits: (fiat: string) => Promise<Limits>;
  quote: (amount: string, fiat: string) => Promise<Quote>;
  checkoutUrl: (o: { orderId: string; wallet: string; amount: string; fiat: string; ip: string; returnUrl: string; theme: "light" | "dark" }) => string;
  fetchTx: (orderId: string) => Promise<ProviderTx | null>;
  verifyWebhook: (raw: string, header: string | null) => null | { ignore: true } | { event: string; tx: ProviderTx };
};

/** Our own record of a card checkout. Lives in Redis as order:<id>. */
export type OrderStatus = "created" | "pending" | "processing" | "paid" | "failed" | "underpaid";
export type CardOrder = {
  id: string; provider: string; linkId: string; to: string; amount: string; fiat: string;
  status: OrderStatus; createdAt: number; updatedAt: number;
  providerId?: string; providerStatus?: string; providerUpdatedAt?: string;
  txHash?: string; received?: string; failure?: string; checkedAt?: number;
};
