"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Plus, Sun, SunDim, X } from "lucide-react";
import { Mark } from "@/components/Logo";
import QR from "@/components/QR";
import PayStatus from "@/components/PayStatus";
import { displayAmount, shortAddress, solanaPayUrl } from "@/lib/solanapay";
import { sound } from "@/lib/sound";
import { fromMicro, linkName, micro, useCountUp, useReducedMotion, type LinkRec } from "./shared";

type Awake = "on" | "fallback" | "off";

/** Keep the screen on: Wake Lock where supported, a silent looping canvas video elsewhere. */
function useStayAwake(): Awake {
  const [st, setSt] = useState<Awake>("off");
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    let video: HTMLVideoElement | null = null;
    let raf = 0, alive = true;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const fallback = async () => {
      if (video) return;
      try {
        const c = document.createElement("canvas"); c.width = c.height = 2;
        const g = c.getContext("2d");
        const stream = (c as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream }).captureStream?.(1);
        if (!stream || !g) throw new Error("no stream");
        const draw = () => { g.fillStyle = `rgb(${Date.now() % 2},0,0)`; g.fillRect(0, 0, 2, 2); raf = requestAnimationFrame(draw); };
        draw();
        video = document.createElement("video");
        Object.assign(video, { muted: true, playsInline: true, loop: true, srcObject: stream });
        video.setAttribute("playsinline", ""); video.setAttribute("aria-hidden", "true");
        video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0";
        document.body.appendChild(video);
        await video.play();
        if (alive) setSt("fallback");
      } catch { if (alive) setSt("off"); }
    };
    const get = async () => {
      if (document.visibilityState !== "visible") return;
      if (nav.wakeLock) {
        try { lock = await nav.wakeLock.request("screen"); if (alive) setSt("on"); return; } catch { /* fall back */ }
      }
      await fallback();
    };
    get();
    const vis = () => { if (document.visibilityState === "visible" && !video) get(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", vis);
      lock?.release().catch(() => {});
      cancelAnimationFrame(raf);
      if (video) { video.pause(); video.srcObject = null; video.remove(); }
    };
  }, []);
  return st;
}

export default function CounterMode({ link, onClose, onNew }: { link: LinkRec; onClose: () => void; onNew: () => void }) {
  const reduce = useReducedMotion();
  const awake = useStayAwake();
  const [seen, setSeen] = useState<{ signature?: string; payer?: string | null } | null>(null);
  const isPaid = link.status === "paid" || !!seen;
  const sig = link.paid?.signature ?? seen?.signature;
  const payer = link.paid?.payer ?? seen?.payer ?? null;
  const celebrated = useRef(link.status === "paid");
  const [burst, setBurst] = useState(false);
  const counted = useCountUp(isPaid ? micro(link.amount) : 0, 1100);
  const box = useRef<HTMLDivElement>(null);

  // the live 3 s check inside PayStatus fires this the moment the payment lands
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ ref: string; signature?: string; payer?: string | null }>).detail;
      if (d?.ref === link.ref) setSeen({ signature: d.signature, payer: d.payer });
    };
    window.addEventListener("qova:paid", on);
    return () => window.removeEventListener("qova:paid", on);
  }, [link.ref]);

  // the Paid moment: once
  useEffect(() => {
    if (!isPaid || celebrated.current) return;
    celebrated.current = true;
    setBurst(true);
    sound().play("ping");
    try { navigator.vibrate?.([40, 70, 40]); } catch { /* not on iOS */ }
  }, [isPaid]);

  useEffect(() => {
    box.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    document.documentElement.classList.add("ax-lock");
    return () => { window.removeEventListener("keydown", esc); document.documentElement.classList.remove("ax-lock"); };
  }, [onClose]);

  const url = solanaPayUrl({ to: link.to, amount: link.amount, label: link.label || undefined, message: link.message || undefined, ref: link.ref });

  return (
    <div className={`ax-counter${isPaid ? " is-paid" : ""}${burst ? " is-burst" : ""}`} role="dialog" aria-modal="true" aria-label="Counter mode" ref={box} tabIndex={-1}>
      <div className="ax-counter-top">
        <span className="ax-counter-brand"><Mark size={20} /> QOVA</span>
        <span className="ax-counter-awake mono" title={awake === "off" ? "Your browser may dim the screen. Change your screen timeout if it does." : "The screen stays on while this is open"}>
          {awake === "off" ? <SunDim size={13} /> : <Sun size={13} />}{awake === "off" ? "Screen may dim" : "Screen stays on"}
        </span>
        <button type="button" className="ax-counter-x" onClick={onClose} aria-label="Close counter mode"><X size={20} /></button>
      </div>

      {!isPaid ? (
        <div className="ax-counter-body">
          <p className="mono ax-counter-k">{linkName(link)}</p>
          <p className="ax-counter-amt">{displayAmount(link.amount)}<small>USDC</small></p>
          <div className="ax-counter-qr"><QR value={url} label={`Scan with a Solana wallet to pay ${displayAmount(link.amount)} USDC`} /></div>
          <p className="ax-counter-hint">Scan with any Solana wallet to pay</p>
          <div className="ax-counter-status"><PayStatus key={link.ref} to={link.to} amount={link.amount} refKey={link.ref} label={link.label} message={link.message} notify dark /></div>
        </div>
      ) : (
        <div className="ax-counter-body ax-paid" role="status" aria-live="assertive">
          <div className="ax-paid-ring" aria-hidden="true">
            {!reduce && <><i /><i /><i /></>}
            <svg viewBox="0 0 120 120" width="132" height="132">
              <circle cx="60" cy="60" r="54" className="ax-paid-c" />
              <path d="M38 62 L54 77 L84 46" className="ax-paid-k" pathLength={1} />
            </svg>
          </div>
          <p className="mono ax-counter-k">Paid</p>
          <p className="ax-counter-amt ax-paid-amt">{fromMicro(Math.round(counted))}<small>USDC</small></p>
          <p className="ax-paid-sub">{linkName(link)}{payer ? ` · from ${shortAddress(payer)}` : ""}</p>
          <p className="ax-paid-fine">Confirmed on Solana. It is in your wallet.</p>
          <div className="ax-paid-actions">
            {sig && <a className="ax-btn ax-btn-ghost" href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer">Receipt <ExternalLink size={14} /></a>}
            <button type="button" className="ax-btn ax-btn-light" onClick={onNew}><Plus size={16} /> New link</button>
          </div>
          <button type="button" className="ax-linkbtn ax-paid-done" onClick={onClose}><Check size={14} /> Done</button>
        </div>
      )}
      <p className="ax-counter-foot">Wallet to wallet. QOVA never holds the money.</p>
    </div>
  );
}
