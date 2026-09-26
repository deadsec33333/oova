"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink } from "lucide-react";

type S = { status: "pending" | "paid" | "unavailable" | "error" | "invalid"; signature?: string; payer?: string | null };

/**
 * Watches Solana for this link's payment. Polls a read only endpoint while the tab is visible
 * and checks again the moment you come back to it (after paying in a wallet app, for example).
 */
export default function PayStatus({ to, amount, refKey, dark = false, notify, label, message }: {
  to: string; amount: string; refKey: string; dark?: boolean; notify?: boolean; label?: string; message?: string;
}) {
  const [s, setS] = useState<S>({ status: "pending" });
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    setS({ status: "pending" });
    let timer: ReturnType<typeof setTimeout>;
    let inflight = false;
    const started = Date.now();
    const q = new URLSearchParams({ to, amount, ref: refKey }).toString();
    const check = async () => {
      if (done.current || inflight || document.visibilityState !== "visible") return;
      inflight = true;
      try {
        const r = await fetch(`/api/pay/status?${q}`, { cache: "no-store" });
        const j = (await r.json()) as S;
        if (j.status === "paid") {
          done.current = true; setS(j);
          window.dispatchEvent(new CustomEvent("qova:step", { detail: 3 }));
          if (notify) window.dispatchEvent(new CustomEvent("qova:paid", { detail: { ref: refKey, amount, label, message, signature: j.signature, payer: j.payer } }));
          else window.dispatchEvent(new Event("qova:made"));
        } else if (j.status === "unavailable" || j.status === "invalid") { done.current = true; setS(j); }
      } catch { /* keep trying */ } finally { inflight = false; }
    };
    const loop = async () => {
      await check();
      if (done.current) return;
      timer = setTimeout(loop, Date.now() - started < 10 * 60_000 ? 3000 : 10000);
    };
    const back = () => { if (document.visibilityState === "visible") check(); };
    timer = setTimeout(loop, 1500);
    document.addEventListener("visibilitychange", back);
    window.addEventListener("focus", back);
    window.addEventListener("pageshow", back);
    return () => {
      done.current = true; clearTimeout(timer);
      document.removeEventListener("visibilitychange", back); window.removeEventListener("focus", back); window.removeEventListener("pageshow", back);
    };
  }, [to, amount, refKey, notify, label, message]);

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
