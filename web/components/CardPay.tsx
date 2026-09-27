"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CreditCard, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import { displayAmount } from "@/lib/solanapay";

type Quote =
  | { available: true; provider: string; terms: string; privacy: string; country: string; fiat: string; youPay: number; price: number; providerFee: number; networkFee: number; ourFee: number; receiverGets: string; minUsdc: number | null; maxUsdc: number | null; expiresAt: string | null }
  | { available: false; reason: string; country?: string; minUsdc?: number; maxUsdc?: number; provider?: string };

const SYM: Record<string, string> = { usd: "$", eur: "€", gbp: "£" };
const money = (n: number, fiat: string) => `${SYM[fiat] ?? ""}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${SYM[fiat] ? "" : ` ${fiat.toUpperCase()}`}`;

function why(q: Extract<Quote, { available: false }>): string {
  const p = q.provider ?? "Our card partner";
  switch (q.reason) {
    case "not_saved": return "This link takes wallet payments only.";
    case "off": return "The receiver turned card payments off for this link.";
    case "paid": return "This link is already paid.";
    case "region": return `${p} does not offer card payments${q.country ? ` in your country (${q.country})` : " where you are"} yet.`;
    case "min": return `Card payments start at ${displayAmount(String(q.minUsdc))} USDC with ${p}. This link is below that.`;
    case "max": return `Card payments go up to ${displayAmount(String(q.maxUsdc))} USDC with ${p}. This link is above that.`;
    case "slow_down": return "Too many tries. Wait a minute.";
    default: return "Card payments are not available right now. Try again soon, or pay with a wallet.";
  }
}

/** The two ways to pay a link. Card is only offered when the provider can serve this payer and amount. */
export default function PayOptions({ to, amount, refKey, children }: { to: string; amount: string; refKey?: string; children: React.ReactNode }) {
  const [mode, setMode] = useState<"wallet" | "card">("wallet");
  const [q, setQ] = useState<Quote | null>(null);
  const [fiat, setFiat] = useState<string>("");
  const [going, setGoing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (f?: string) => {
    if (!refKey) return;
    try {
      const qs = new URLSearchParams({ to, amount, ref: refKey, ...(f ? { fiat: f } : {}) });
      const r = await fetch(`/api/pay/card/quote?${qs}`, { cache: "no-store" });
      const j = (await r.json()) as Quote;
      setQ(j);
      if (j.available) setFiat(j.fiat);
    } catch { setQ({ available: false, reason: "provider_down" }); }
  }, [to, amount, refKey]);

  useEffect(() => { load(); }, [load]);
  // live quote: refresh every 30 s while the card option is open and the tab is visible
  useEffect(() => {
    if (mode !== "card" || !q?.available) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") load(fiat); }, 30_000);
    return () => clearInterval(t);
  }, [mode, q?.available, fiat, load]);

  const hidden = !refKey || q === null || (!q.available && (q.reason === "off_platform" || q.reason === "invalid"));

  async function go() {
    setErr(""); setGoing(true);
    try {
      const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      const r = await fetch("/api/pay/card/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to, amount, ref: refKey, fiat, theme }) });
      const j = (await r.json()) as { url?: string; error?: string } & Partial<Extract<Quote, { available: false }>>;
      if (!r.ok || !j.url) { setErr(j.error === "slow_down" ? "Too many tries. Wait a minute." : why({ available: false, reason: j.error ?? "provider_down", ...j })); setGoing(false); return; }
      try { sessionStorage.setItem("qova-card-back", location.href); } catch { /* ignore */ }
      location.href = j.url;
    } catch { setErr("Could not open the card checkout. Try again."); setGoing(false); }
  }

  return (
    <div className="po">
      {!hidden && (
        <div className="po-tabs" role="tablist" aria-label="How do you want to pay">
          <button role="tab" aria-selected={mode === "wallet"} className={mode === "wallet" ? "is-on" : ""} onClick={() => setMode("wallet")}><Wallet size={16} /> Solana wallet</button>
          <button role="tab" aria-selected={mode === "card"} className={mode === "card" ? "is-on" : ""} onClick={() => setMode("card")}><CreditCard size={16} /> Card or Apple Pay</button>
        </div>
      )}

      {mode === "wallet" || hidden ? <div className="po-wallet">{children}</div> : (
        <div className="po-card" role="tabpanel">
          {!q ? null : !q.available ? (
            <div className="po-off"><b>Card payment is not available</b><p>{why(q)}</p><button className="btn btn-outline btn-sm" onClick={() => setMode("wallet")}>Pay with a Solana wallet</button></div>
          ) : (
            <>
              <p className="po-h">Pay with card, Apple Pay or Google Pay</p>
              <div className="po-quote" aria-live="polite">
                <div className="po-row po-big"><span>You pay</span><b>{money(q.youPay, q.fiat)}</b></div>
                <div className="po-row po-big"><span>Receiver gets</span><b>{displayAmount(q.receiverGets)} USDC</b></div>
                <div className="po-sep" />
                <div className="po-row"><span>USDC at {q.provider}&rsquo;s price</span><span>{money(q.price, q.fiat)}</span></div>
                <div className="po-row"><span>{q.provider} fee</span><span>{money(q.providerFee, q.fiat)}</span></div>
                <div className="po-row"><span>Solana network fee</span><span>{money(q.networkFee, q.fiat)}</span></div>
                <div className="po-row"><span>QOVA fee</span><span>{money(0, q.fiat)}</span></div>
                <div className="po-foot">
                  <span>Live quote from {q.provider}. The final price is confirmed in their checkout.</span>
                  <label className="po-fiat"><span className="sr">Currency</span>
                    <select value={fiat} onChange={(e) => { setFiat(e.target.value); load(e.target.value); }}>
                      <option value="usd">USD</option><option value="eur">EUR</option><option value="gbp">GBP</option>
                    </select>
                  </label>
                </div>
              </div>
              {q.minUsdc ? <p className="po-min">Card minimum with {q.provider}: {displayAmount(String(q.minUsdc))} USDC</p> : null}
              <button className="btn btn-chrome btn-wide po-go" onClick={go} disabled={going}>
                {going ? <LoaderCircle size={16} className="ax-spin" /> : null} Continue to {q.provider} <ArrowRight size={16} />
              </button>
              {err && <p className="ax-err" role="alert">{err}</p>}
              <div className="po-note">
                <p><ShieldCheck size={14} /> Processed by {q.provider}. They handle your card and may ask for ID. QOVA never sees your card and never holds the money: the USDC goes straight to the receiver&rsquo;s wallet.</p>
                <p>Card payments can take a few minutes to arrive on Solana.</p>
                <p><a href={q.terms} target="_blank" rel="noreferrer">{q.provider} terms</a> · <a href={q.privacy} target="_blank" rel="noreferrer">Privacy</a> · $QOVA is a memecoin, not a dollar.</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
