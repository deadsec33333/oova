"use client";
import { useEffect, useState } from "react";
import { Building2, Clock, Lock, Snowflake, User, Wallet, Zap } from "lucide-react";
import TokenIcon from "./TokenIcon";
import { Mark } from "./Logo";

type Mode = "typical" | "qova";

/** Same payment, two worlds. Flip between a typical custodial app and QOVA. Illustration. */
export default function Compare() {
  const [mode, setMode] = useState<Mode>("typical");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setMode((m) => (m === "typical" ? "qova" : "typical")), 5200);
    return () => clearInterval(t);
  }, [touched]);
  const pick = (m: Mode) => { setTouched(true); setMode(m); window.dispatchEvent(m === "qova" ? new Event("qova:made") : new CustomEvent("qova:step", { detail: 1 })); };

  return (
    <div className={`cmp is-${mode}`}>
      <div className="cmp-top">
        <div className="cmp-switch" role="tablist" aria-label="Compare">
          <button role="tab" aria-selected={mode === "typical"} className={mode === "typical" ? "is-on" : ""} onClick={() => pick("typical")}><span className="cmp-long">Typical payment app</span><span className="cmp-short">Typical app</span></button>
          <button role="tab" aria-selected={mode === "qova"} className={mode === "qova" ? "is-on" : ""} onClick={() => pick("qova")}><Mark size={14} /> QOVA</button>
          <span className="cmp-knob" aria-hidden="true" />
        </div>
        <span className="mono cmp-note">Illustration</span>
      </div>

      <div className="cmp-stage" aria-live="polite">
        <div className="cmp-node"><span className="cmp-ico"><User size={20} /></span><b>Your client</b><span className="mono">sends 25.00</span></div>

        <div className="cmp-track">
          <span className="cmp-line" />
          {[0, 1, 2].map((i) => <span key={i} className={`cmp-coin c${i}`}><TokenIcon kind="usdc" size={30} /></span>)}

          <div className="cmp-vault" aria-hidden={mode !== "typical"}>
            <div className="cmp-vault-box">
              <Building2 size={18} />
              <b>Their account</b>
              <span className="cmp-pile">{[0, 1, 2].map((i) => <i key={i} />)}</span>
              <span className="cmp-lock"><Lock size={13} /></span>
            </div>
            <div className="cmp-tags">
              <span><Clock size={12} /> Waits</span>
              <span><Snowflake size={12} /> Can freeze</span>
              <span>% Cash out fee</span>
            </div>
          </div>

          <div className="cmp-glass" aria-hidden={mode !== "qova"}>
            <div className="cmp-pane"><Mark size={16} /><span><b>QOVA</b><small>writes the link, stays out of the way</small></span></div>
          </div>
        </div>

        <div className="cmp-node cmp-you"><span className="cmp-ico"><Wallet size={20} /></span><b>You</b><span className="mono cmp-you-t"><span className="t1">waiting…</span><span className="t2">+25.00 in your wallet</span></span></div>
      </div>

      <div className="cmp-captions">
        <p className="cap-typical">Most apps take the money first. It sits in their account until they release it to you.</p>
        <p className="cap-qova"><Zap size={15} /> With QOVA it goes straight from their wallet to yours. There is no middle account to wait in.</p>
      </div>
    </div>
  );
}
