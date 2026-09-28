"use client";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Clock, ExternalLink, LoaderCircle } from "lucide-react";
import { displayAmount, shortAddress } from "@/lib/solanapay";

type S = { network?: string; status: "created" | "pending" | "processing" | "paid" | "failed" | "underpaid" | "not_found" | "slow_down"; amount?: string; to?: string; provider?: string; txHash?: string | null; received?: string | null; failure?: string | null };

/** Pending, processing and paid states for a card checkout. Polls our server, which confirms on Solana. */
export default function CardReturn({ order }: { order: string }) {
  const [s, setS] = useState<S | null>(null);
  const [back, setBack] = useState("");

  useEffect(() => {
    try { setBack(sessionStorage.getItem("qova-card-back") ?? ""); } catch { /* ignore */ }
    let t: ReturnType<typeof setTimeout>, done = false;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const sp = new URLSearchParams(location.search);
          const pid = sp.get("paymentId") ?? sp.get("paymentid") ?? "";
          const r = await fetch(`/api/pay/card/status?o=${encodeURIComponent(order)}${pid ? `&pid=${encodeURIComponent(pid)}` : ""}`, { cache: "no-store" });
          const j = (await r.json()) as S;
          if (j.status !== "slow_down") setS(j);
          if (["paid", "failed", "underpaid", "not_found"].includes(j.status)) done = true;
        } catch { /* keep trying */ }
      }
      if (!done) t = setTimeout(tick, 4000);
    };
    tick();
    const vis = () => { if (document.visibilityState === "visible" && !done) { clearTimeout(t); tick(); } };
    document.addEventListener("visibilitychange", vis);
    return () => { done = true; clearTimeout(t); document.removeEventListener("visibilitychange", vis); };
  }, [order]);

  const p = s?.provider ?? "MoonPay";
  const amt = s?.amount ? `${displayAmount(s.amount)} USDC` : "";
  const to = s?.to ? shortAddress(s.to) : "";
  const backLink = back ? <a href={back} className="btn btn-outline btn-wide"><ArrowLeft size={16} /> Back to the pay link</a> : null;

  if (!s) return <div className="cr"><span className="cr-ico"><LoaderCircle size={22} className="ax-spin" /></span><h1 className="cr-h">Checking your payment</h1></div>;
  if (s.status === "not_found") return <div className="cr"><span className="cr-ico"><AlertCircle size={22} /></span><h1 className="cr-h">We can&rsquo;t find this payment</h1><p className="cr-p">The link may be wrong. Nothing was charged by QOVA; card payments are handled by our partner.</p>{backLink}</div>;

  if (s.status === "paid") return (
    <div className="cr is-paid" role="status">
      <span className="cr-ico cr-mint"><Check size={24} strokeWidth={3} /></span>
      <p className="mono cr-k">Paid by card</p>
      <h1 className="cr-h">{amt} arrived</h1>
      <p className="cr-p">It is in the receiver&rsquo;s wallet ({to}), confirmed on Solana.</p>
      {s.txHash && <a className="btn btn-chrome btn-wide" href={`https://solscan.io/tx/${s.txHash}${s.network === "devnet" ? "?cluster=devnet" : ""}`} target="_blank" rel="noreferrer">Receipt on Solscan <ExternalLink size={15} /></a>}
      <p className="fine center">Your card receipt comes from {p} by email.</p>
    </div>
  );

  if (s.status === "failed") return (
    <div className="cr" role="alert">
      <span className="cr-ico"><AlertCircle size={22} /></span>
      <h1 className="cr-h">The card payment did not go through</h1>
      <p className="cr-p">{s.failure || "Nothing was sent."} If your card was charged, {p} refunds it; contact {p} support with your receipt.</p>
      {backLink}
    </div>
  );

  if (s.status === "underpaid") return (
    <div className="cr" role="alert">
      <span className="cr-ico"><AlertCircle size={22} /></span>
      <h1 className="cr-h">Less USDC arrived than asked</h1>
      <p className="cr-p">{s.received} of {s.amount} USDC reached the receiver. The link stays open. Contact {p} support with your receipt.</p>
      {s.txHash && <a className="btn btn-outline btn-wide" href={`https://solscan.io/tx/${s.txHash}${s.network === "devnet" ? "?cluster=devnet" : ""}`} target="_blank" rel="noreferrer">See the transfer <ExternalLink size={15} /></a>}
    </div>
  );

  const processing = s.status === "processing";
  return (
    <div className="cr" role="status" aria-live="polite">
      <span className="cr-ico"><LoaderCircle size={22} className="ax-spin" /></span>
      <p className="mono cr-k">{processing ? "Processing" : "Pending"}</p>
      <h1 className="cr-h">{processing ? `${p} is sending ${amt}` : `Finish paying in ${p}`}</h1>
      <p className="cr-p">{processing
        ? "Your card payment went through. The USDC is on its way to the receiver on Solana. This can take a few minutes. You can close this page; the receiver is told the moment it lands."
        : `We are waiting for ${p} to confirm your card payment. If you closed the checkout without paying, go back to the link.`}</p>
      <ol className="cr-steps">
        <li className="is-done"><Check size={13} strokeWidth={3} /> Checkout opened</li>
        <li className={processing ? "is-done" : "is-now"}>{processing ? <Check size={13} strokeWidth={3} /> : <Clock size={13} />} Card payment</li>
        <li className={processing ? "is-now" : ""}><Clock size={13} /> USDC lands on Solana</li>
      </ol>
      {!processing && backLink}
      <p className="fine center">Order {order.slice(0, 10)} · handled by {p}. QOVA never holds the money.</p>
    </div>
  );
}
