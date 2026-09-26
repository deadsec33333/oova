"use client";
/** Shared sign in state for every page. One fetch, many listeners. */
import { useEffect, useSyncExternalStore } from "react";
import type { FoundWallet } from "./wallets";

export type Account = { loaded: boolean; ready: boolean; wallet: string | null };
const SERVER: Account = { loaded: false, ready: false, wallet: null };
let state: Account = SERVER;
const subs = new Set<() => void>();
const set = (s: Partial<Account>) => { state = { ...state, ...s }; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
let loading: Promise<void> | null = null;

export function loadAccount(force = false) {
  if (loading && !force) return loading;
  loading = fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { ready?: boolean; wallet?: string | null }) => set({ loaded: true, ready: !!j.ready, wallet: j.wallet ?? null }))
    .catch(() => set({ loaded: true }));
  return loading;
}
export const getAccount = () => state;

export function useAccount(): Account {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(() => { loadAccount(); }, []);
  return s;
}

const post = (url: string, body?: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

export type Phase = "idle" | "connect" | "sign" | "verify";

/** Connect, get the server's message, sign it (free, never a transaction), start a session. */
export async function signInWith(w: FoundWallet, onPhase: (p: Phase, message?: string) => void): Promise<string> {
  onPhase("connect");
  const address = await w.connect();
  const r = await post("/api/auth/nonce", { wallet: address });
  if (r.status === 429) throw new Error("slow");
  if (!r.ok) throw new Error("server");
  const { message } = (await r.json()) as { message: string };
  onPhase("sign", message);
  const signature = await w.signMessage(address, message);
  onPhase("verify", message);
  const v = await post("/api/auth/verify", { wallet: address, message, signature });
  if (!v.ok) throw new Error("verify");
  set({ wallet: address, ready: true, loaded: true });
  window.dispatchEvent(new Event("qova:account"));
  window.dispatchEvent(new Event("qova:made"));
  return address;
}

export function signInError(e: unknown): string {
  const t = e instanceof Error ? e.message : "";
  return t === "slow" ? "Too many tries. Wait a minute and try again."
    : t === "server" ? "Sign in is not available right now. Try again soon."
    : t === "verify" ? "That signature did not check out. Nothing happened, try again."
    : "Cancelled in the wallet. Nothing was signed.";
}

export async function signOut() {
  try { await post("/api/auth/logout"); } finally { set({ wallet: null }); window.dispatchEvent(new Event("qova:account")); }
}

/** Open the connect sheet from anywhere. */
export const openConnect = () => window.dispatchEvent(new Event("qova:connect"));
