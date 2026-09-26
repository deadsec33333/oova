"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink } from "lucide-react";

type S = { status: "pending" | "paid" | "unavailable" | "error" | "invalid"; signature?: string; payer?: string | null };

/** Watches Solana for this link's payment. Polls a read only endpoint every few seconds while the tab is visible. */
export default function PayStatus({ to, amount, refKey, dark = false }: { to: string; amount: string; refKey: string; dark?: boolean }) {
  const [s, setS] = useState<S>({ status: "pending" });
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    setS({ status: "pending" });
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const q = new URLSearchParams({ to, amount, ref: refKey }).toString();
    const tick = async () => {
      if (done.current) return;
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(`/api/pay/status?${q}`, { cache: "no-store" });
          const j = (await r.json()) as S;
          if (j.status === "paid") { done.current = true; setS(j); window.dispatchEvent(new Event("qova:made")); window.dispatchEvent(new CustomEvent("qova:step", { detail: 3 })); return; }
          if (j.status === "unavailable" || j.status === "invalid") { done.current = true; setS(j); return; }
        } catch { /* keep trying */ }
      }
      const wait = Date.now() - started < 10 * 60_000 ? 3000 : 10000;
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, 1500);
    return () => { done.current = true; clearTimeout(timer); };
  }, [to, amount, refKey]);

  if (s.status === "unavailable" || s.status === "invalid") return null;
  if (s.status === "paid" && s.signature) {
    return (
      <div className={`pst is-paid${dark ? " is-dark" : ""}`} role="status">
        <span className="pst-ico"><Check size={16} strokeWidth={3} /></span>
        <div><b>Paid · {amount} USDC received</b><span className="mono">confirmed on Solana</span></div>
        <a href={`https://solscan.io/tx/${s.signature}`} target="_blank" rel="noopener">Receipt <ExternalLink size={13} /></a>
      </div>
    );
  }
  return (
    <div className={`pst${dark ? " is-dark" : ""}`} role="status">
      <span className="pst-dot" aria-hidden="true" />
      <div><b>Waiting for payment</b><span className="mono">watching Solana live</span></div>
    </div>
  );
}
