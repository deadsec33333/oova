/** Which card provider is active. Coinflow first (normal card checkout, no crypto account), MoonPay as the fallback. */
import "server-only";
import { coinflow } from "./coinflow";
import { moonpay } from "./moonpay";
import type { Onramp } from "./types";

export const providers: Record<string, Onramp> = { coinflow, moonpay };

/** ONRAMP_PROVIDER can force one ("coinflow" or "moonpay"); otherwise the first one with its keys set. */
export function activeOnramp(): Onramp {
  const pick = process.env.ONRAMP_PROVIDER?.trim().toLowerCase();
  if (pick && providers[pick]?.configured()) return providers[pick];
  return [coinflow, moonpay].find((p) => p.configured()) ?? moonpay;
}

/** The provider an order was made with. Older orders stored the display name. */
export function providerOf(v: string): Onramp {
  return providers[v.toLowerCase()] ?? moonpay;
}
