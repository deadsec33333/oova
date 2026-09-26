"use client";
import { useEffect, useState } from "react";

const PARTS = [
  { t: "solana:", k: "Scheme", d: "Tells the phone to open a Solana wallet. Nothing runs on QOVA." },
  { t: "7xKX…9fQ2", k: "Your address", d: "Where the money goes. Public, safe to share, like an account number." },
  { t: "?amount=25.00", k: "Amount", d: "The exact amount you asked for. The payer cannot change it." },
  { t: "&spl-token=EPjF…Dt1v", k: "Token", d: "USDC on Solana, the digital dollar issued by Circle." },
  { t: "&reference=5V9T…GCBK", k: "Reference", d: "A random tag so this payment can be found on chain later." },
  { t: "&label=Ada%20Studio", k: "Label", d: "Your name, shown in the payer's wallet. Set by you." },
];

/** Shows, part by part, what a QOVA pay link contains. Cycles on its own, hover or tap to pin. */
export default function LinkAnatomy() {
  const [i, setI] = useState(0);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (pinned || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % PARTS.length), 2400);
    return () => clearInterval(t);
  }, [pinned]);
  return (
    <div className="anatomy" onMouseLeave={() => setPinned(false)}>
      <div className="an-head"><span className="mono">What is inside a pay link</span><span className="mono an-live"><i />Plain data, nothing hidden</span></div>
      <div className="an-url mono" role="list">
        {PARTS.map((p, n) => (
          <button key={p.k} type="button" role="listitem" className={n === i ? "an-part is-on" : "an-part"} onMouseEnter={() => { setI(n); setPinned(true); }} onFocus={() => { setI(n); setPinned(true); }} onClick={() => { setI(n); setPinned(true); }}>{p.t}</button>
        ))}
      </div>
      <div className="an-desc" aria-live="polite">
        <span key={PARTS[i].k} className="an-k mono">{String(i + 1).padStart(2, "0")} · {PARTS[i].k}</span>
        <p key={PARTS[i].d}>{PARTS[i].d}</p>
      </div>
      <div className="an-bar"><i style={{ transform: `scaleX(${(i + 1) / PARTS.length})` }} /></div>
    </div>
  );
}
