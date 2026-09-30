"use client";
/**
 * Minimal Solana wallet discovery with no extra packages.
 * Uses the Wallet Standard (Phantom, Solflare, Backpack and most modern wallets),
 * with a fallback to older injected providers. Only two things are ever requested:
 * connect (read the public address) and signMessage (a free text message).
 * Never a transaction.
 */
import bs58 from "bs58";

export type FoundWallet = {
  name: string;
  icon?: string;
  connect: () => Promise<string>;
  signMessage: (address: string, text: string) => Promise<string>;
};

type StdAccount = { address: string; publicKey: Uint8Array };
type StdWallet = {
  name: string; icon?: string; chains?: readonly string[]; accounts: readonly StdAccount[];
  features: Record<string, unknown>;
};
type Legacy = {
  publicKey?: { toString(): string } | null;
  connect: () => Promise<{ publicKey?: { toString(): string } } | void>;
  signMessage: (m: Uint8Array, enc?: string) => Promise<Uint8Array | { signature: Uint8Array }>;
};

const enc = (t: string) => new TextEncoder().encode(t);

function fromStandard(w: StdWallet): FoundWallet | null {
  const connectF = w.features["standard:connect"] as { connect: () => Promise<{ accounts: readonly StdAccount[] }> } | undefined;
  const signF = w.features["solana:signMessage"] as { signMessage: (...i: { account: StdAccount; message: Uint8Array }[]) => Promise<{ signature: Uint8Array }[]> } | undefined;
  const solana = (w.chains ?? []).some((c) => c.startsWith("solana:"));
  if (!connectF || !signF || !solana) return null;
  let acct: StdAccount | undefined;
  return {
    name: w.name,
    icon: w.icon,
    async connect() {
      const r = await connectF.connect();
      acct = (r.accounts?.[0] ?? w.accounts?.[0]);
      if (!acct) throw new Error("no_account");
      return acct.address;
    },
    async signMessage(address, text) {
      const a = acct && acct.address === address ? acct : w.accounts.find((x) => x.address === address);
      if (!a) throw new Error("no_account");
      const [out] = await signF.signMessage({ account: a, message: enc(text) });
      return bs58.encode(out.signature);
    },
  };
}

function fromLegacy(name: string, p: Legacy | undefined): FoundWallet | null {
  if (!p || typeof p.signMessage !== "function") return null;
  return {
    name,
    async connect() {
      const r = await p.connect();
      const pk = (r && "publicKey" in r ? r.publicKey : null) ?? p.publicKey;
      if (!pk) throw new Error("no_account");
      return pk.toString();
    },
    async signMessage(_a, text) {
      const r = await p.signMessage(enc(text), "utf8");
      return bs58.encode(r instanceof Uint8Array ? r : r.signature);
    },
  };
}

/** Collect wallets. Calls `onChange` as late wallets register. Returns a stop function. */
export function watchWallets(onChange: (list: FoundWallet[]) => void): () => void {
  const std: StdWallet[] = [];
  let stopped = false;
  const emit = () => {
    if (stopped) return;
    const list: FoundWallet[] = [];
    const seen = new Set<string>();
    for (const w of std) { const f = fromStandard(w); if (f && !seen.has(f.name)) { seen.add(f.name); list.push(f); } }
    const g = window as unknown as { phantom?: { solana?: Legacy }; solflare?: Legacy; backpack?: Legacy; solana?: Legacy & { isPhantom?: boolean } };
    const legacy: [string, Legacy | undefined][] = [["Phantom", g.phantom?.solana ?? (g.solana?.isPhantom ? g.solana : undefined)], ["Solflare", g.solflare], ["Backpack", g.backpack]];
    for (const [n, p] of legacy) { if (!seen.has(n)) { const f = fromLegacy(n, p); if (f) { seen.add(n); list.push(f); } } }
    onChange(list);
  };
  const register = (...ws: StdWallet[]) => { std.push(...ws); emit(); return () => {}; };
  const api = Object.freeze({ register });
  const onReg = (e: Event) => { const cb = (e as CustomEvent).detail; if (typeof cb === "function") cb(api); };
  window.addEventListener("wallet-standard:register-wallet", onReg);
  try { window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: api })); } catch { /* ignore */ }
  emit();
  const t = setTimeout(emit, 600);
  return () => { stopped = true; clearTimeout(t); window.removeEventListener("wallet-standard:register-wallet", onReg); };
}

/** Deep links that open this page inside a mobile wallet's browser. */
export function walletBrowseLinks(url: string) {
  const u = encodeURIComponent(url), ref = encodeURIComponent(new URL(url).origin);
  return [
    { name: "Phantom", href: `https://phantom.app/ul/browse/${u}?ref=${ref}` },
    { name: "Solflare", href: `https://solflare.com/ul/v1/browse/${u}?ref=${ref}` },
  ];
}
