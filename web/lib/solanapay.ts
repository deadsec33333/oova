import bs58 from "bs58";

/** USDC on Solana mainnet (issued by Circle). */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const MAX_AMOUNT = 1_000_000;

export function isSolanaAddress(value: string): boolean {
  const v = value.trim();
  if (v.length < 32 || v.length > 44) return false;
  try {
    return bs58.decode(v).length === 32;
  } catch {
    return false;
  }
}

/** Plain decimal, up to 6 places (USDC decimals), above 0, capped. */
export function parseAmount(value: string): string | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,6})?$/.test(v)) return null;
  const n = Number(v);
  if (!(n > 0) || n > MAX_AMOUNT) return null;
  return v.replace(/^0+(?=\d)/, "");
}

/** Short free text for label and message: no control chars, trimmed. */
export function cleanText(value: string | undefined | null, max: number): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

export function newReference(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bs58.encode(bytes);
}

export type PayRequest = { to: string; amount: string; label?: string; message?: string; ref?: string };

/** Solana Pay transfer request URL: the wallet builds and signs the transfer itself. */
export function solanaPayUrl(r: PayRequest): string {
  const q = new URLSearchParams();
  q.set("amount", r.amount);
  q.set("spl-token", USDC_MINT);
  if (r.ref) q.set("reference", r.ref);
  if (r.label) q.set("label", r.label);
  if (r.message) q.set("message", r.message);
  return `solana:${r.to}?${q.toString().replace(/\+/g, "%20")}`;
}

/** Link to our pay page, the thing people share. */
export function payPageUrl(origin: string, r: PayRequest): string {
  const q = new URLSearchParams();
  q.set("to", r.to);
  q.set("amount", r.amount);
  if (r.label) q.set("label", r.label);
  if (r.message) q.set("message", r.message);
  if (r.ref) q.set("ref", r.ref);
  return `${origin}/pay?${q.toString()}`;
}

export function shortAddress(a: string): string {
  return a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}
