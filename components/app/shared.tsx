"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { displayAmount } from "@/lib/solanapay";

export type LinkRec = {
  id: string; to: string; amount: string; label: string; message: string; ref: string; createdAt: number; status: "open" | "paid";
  card?: boolean;
  cardOrders?: { id: string; status: string; at: number }[];
  paid?: { signature: string; payer: string | null; blockTime: number | null; exact: boolean; method?: "wallet" | "card"; provider?: string; orderId?: string; network?: "devnet" };
};
export const byCard = (l: LinkRec) => l.paid?.method === "card";
/** Solscan link for a transaction, on devnet for sandbox test payments. */
export const txUrl = (sig: string, network?: string) => `https://solscan.io/tx/${sig}${network === "devnet" ? "?cluster=devnet" : ""}`;
/** A card checkout on this link that has not finished yet, if any. */
export const cardInFlight = (l: LinkRec) => l.status === "open" ? (l.cardOrders ?? []).find((o) => ["pending", "processing"].includes(o.status) && Date.now() - o.at < 3 * 86400_000) : undefined;

export const DAY = 86400_000;
export const post = (url: string, body?: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

export const micro = (a: string) => { const [i, f = ""] = a.split("."); return Number(i) * 1e6 + Number((f + "000000").slice(0, 6)); };
export const fromMicro = (n: number) => displayAmount((Math.max(0, n) / 1e6).toFixed(6).replace(/0{1,4}$/, ""));
export const linkName = (l: LinkRec) => l.message || l.label || "Pay link";
/** When the money landed, in ms. Falls back to when the link was made if the chain gave no time. */
export const paidAt = (l: LinkRec) => (l.paid?.blockTime ? l.paid.blockTime * 1000 : l.createdAt);

export function when(ms: number) {
  const d = Date.now() - ms, m = Math.round(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48) return "yesterday";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export const fullDate = (ms: number) => new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
export function dayLabel(ms: number) {
  const t = startOfDay(Date.now()), d = startOfDay(ms);
  if (d === t) return "Today";
  if (d === t - DAY || (t - d > 0 && t - d < 1.5 * DAY)) return "Yesterday";
  return new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(m.matches); on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return r;
}

/** Counts from the last shown value to the new one. Instant when motion is reduced. */
export function useCountUp(target: number, ms = 900) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(target);
  const from = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); from.current = target; first.current = false; return; }
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (start === target) { setV(target); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      const cur = start + (target - start) * e;
      setV(cur); from.current = cur;
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);
  return v;
}

export async function copyText(t: string) { try { await navigator.clipboard.writeText(t); return true; } catch { return false; } }

/** Native share sheet where the device has one, copy everywhere else. Returns what happened. */
export async function shareLink(url: string, title: string, text: string): Promise<"shared" | "copied" | "none"> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
  const data = { title, text, url };
  if (nav.share && (!nav.canShare || nav.canShare(data))) {
    try { await nav.share(data); return "shared"; } catch (e) { if ((e as Error)?.name === "AbortError") return "none"; }
  }
  return (await copyText(url)) ? "copied" : "none";
}

export function CopyIcon({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={className} aria-label={ok ? "Copied" : label} title={label}
      onClick={async (e) => { e.stopPropagation(); if (await copyText(text)) { setOk(true); setTimeout(() => setOk(false), 1400); } }}>
      {ok ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
    </button>
  );
}

/** Bottom sheet on phones, side drawer on desktop. Esc and the backdrop close it. */
export function Sheet({ label, onClose, children, wide = false }: { label: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const card = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const close = useRef(onClose); close.current = onClose;
  const shut = () => { setClosing(true); setTimeout(() => close.current(), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220); };
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    card.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") shut(); };
    window.addEventListener("keydown", esc);
    document.documentElement.classList.add("ax-lock");
    return () => { window.removeEventListener("keydown", esc); document.documentElement.classList.remove("ax-lock"); prev?.focus?.(); };
  }, []);
  // drag the handle down to close on phones
  const drag = useRef<{ y: number; dy: number } | null>(null);
  return (
    <div className={`ax-sheet${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={label} onClick={shut}>
      <div ref={card} className={`ax-sheet-card${wide ? " is-wide" : ""}`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="ax-sheet-grab"
          onPointerDown={(e) => { drag.current = { y: e.clientY, dy: 0 }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (!drag.current || !card.current) return; drag.current.dy = Math.max(0, e.clientY - drag.current.y); card.current.style.transform = `translateY(${drag.current.dy}px)`; }}
          onPointerUp={() => { if (!card.current) return; const dy = drag.current?.dy ?? 0; drag.current = null; card.current.style.transform = ""; if (dy > 90) shut(); }}
          aria-hidden="true"><i /></div>
        <button type="button" className="ax-sheet-x" aria-label="Close" onClick={shut}><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

export function Skel({ w = "100%", h = 14, r = 8, className = "" }: { w?: number | string; h?: number; r?: number; className?: string }) {
  return <span className={`ax-skel ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

export const Amount = ({ a, big = false }: { a: string; big?: boolean }) => (
  <span className={big ? "ax-amt ax-amt-big" : "ax-amt"}>{displayAmount(a)}<small> USDC</small></span>
);
