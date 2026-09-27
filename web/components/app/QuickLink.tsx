"use client";
import { useRef, useState } from "react";
import { Check, Link2, LoaderCircle, Maximize2, Share2 } from "lucide-react";
import { displayAmount, shortAddress } from "@/lib/solanapay";
import { sound } from "@/lib/sound";
import { CopyIcon, post, shareLink, type LinkRec } from "./shared";

const QUICK = ["10", "25", "50", "100"];

/** Make a pay link to the signed in wallet. Used on Home and in the New link sheet. */
export default function QuickLink({ wallet, pageUrl, onMade, onCounter, onSignedOut, autoFocus = false }: {
  wallet: string; pageUrl: (l: LinkRec) => string; onMade: (l: LinkRec) => void; onCounter: (l: LinkRec) => void; onSignedOut: () => void; autoFocus?: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [making, setMaking] = useState(false);
  const [err, setErr] = useState("");
  const [made, setMade] = useState<LinkRec | null>(null);
  const [shared, setShared] = useState("");
  const amt = useRef<HTMLInputElement>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMaking(true); setShared("");
    try {
      const r = await post("/api/links", { amount: amount.trim().replace(",", "."), message: label });
      const j = (await r.json()) as { link?: LinkRec; error?: string };
      if (!r.ok || !j.link) {
        setErr(j.error === "amount" ? "Enter an amount above 0, up to 6 decimals." : j.error === "slow_down" ? "Slow down a little and try again." : j.error === "signin" ? "Please sign in again." : "Could not save the link. Try again.");
        if (j.error === "signin") onSignedOut();
        return;
      }
      setMade(j.link); setAmount(""); setLabel("");
      onMade(j.link);
      sound().play("chime");
    } catch { setErr("Could not save the link. Try again."); }
    finally { setMaking(false); }
  }

  return (
    <div className="ax-quick">
      <form onSubmit={create}>
        <label className="ax-q-amt">
          <span className="ax-sr">Amount in USDC</span>
          <input ref={amt} inputMode="decimal" placeholder="0.00" value={amount} autoFocus={autoFocus}
            onChange={(e) => { setAmount(e.target.value.replace(/[^\d.,]/g, "")); setMade(null); }} required />
          <span className="mono">USDC</span>
        </label>
        <div className="ax-q-chips" role="group" aria-label="Quick amounts">
          {QUICK.map((q) => <button type="button" key={q} className={amount === q ? "is-on" : ""} onClick={() => { setAmount(q); setMade(null); amt.current?.focus(); }}>{q}</button>)}
        </div>
        <label className="ax-sr" htmlFor="ax-for">What is it for</label>
        <input id="ax-for" className="ax-q-for" placeholder="What is it for (optional)" value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} />
        <button type="submit" className="ax-btn ax-btn-main ax-q-btn" disabled={making}>{making ? <LoaderCircle size={16} className="ax-spin" /> : <Link2 size={16} />} Create link</button>
      </form>
      {err && <p className="ax-err" role="alert">{err}</p>}
      {made && (
        <div className="ax-made" role="status">
          <div className="ax-made-t"><span className="ax-made-ico"><Check size={14} strokeWidth={3} /></span><div><b>Link ready · {displayAmount(made.amount)} USDC</b><span className="mono">to {shortAddress(wallet)}</span></div></div>
          <div className="ax-made-a">
            <CopyIcon text={pageUrl(made)} label="Copy link" className="ax-ibtn" />
            <button type="button" className="ax-ibtn" aria-label="Share link" title="Share" onClick={async () => { const r = await shareLink(pageUrl(made), "Pay link", `Pay ${displayAmount(made.amount)} USDC`); if (r === "copied") setShared("Link copied"); }}><Share2 size={15} /></button>
            <button type="button" className="ax-ibtn" aria-label="Show QR full screen" title="Counter mode" onClick={() => onCounter(made)}><Maximize2 size={15} /></button>
          </div>
          {shared && <span className="ax-made-note">{shared}</span>}
        </div>
      )}
      <p className="ax-fine">Paid straight to your wallet. QOVA never holds your money.</p>
    </div>
  );
}
