"use client";
import { useState } from "react";
import QR from "./QR";
import CopyButton from "./CopyButton";
import PayStatus from "./PayStatus";
import { cleanText, displayAmount, isSolanaAddress, newReference, parseAmount, payPageUrl, solanaPayUrl, type PayRequest } from "@/lib/solanapay";

type Result = { req: PayRequest; page: string; wallet: string };

export default function LinkMaker() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ to?: string; amount?: string }>({});
  const [result, setResult] = useState<Result | null>(null);

  function make(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const addr = to.trim();
    const amt = parseAmount(amount);
    if (!isSolanaAddress(addr)) next.to = "That does not look like a Solana wallet address.";
    if (!amt) next.amount = "Enter an amount like 25 or 12.50 (max 1,000,000).";
    setErrors(next);
    if (next.to || next.amount || !amt) return;
    const req: PayRequest = { to: addr, amount: amt, label: cleanText(label, 48) || undefined, message: cleanText(message, 120) || undefined, ref: newReference() };
    setResult({ req, page: payPageUrl(window.location.origin, req), wallet: solanaPayUrl(req) });
    window.dispatchEvent(new Event("qova:made"));
  }

  const shareText = result ? `Pay me ${displayAmount(result.req.amount)} USDC with QOVA` : "";

  return (
    <div className="maker">
      <form className="maker-form" onSubmit={make} noValidate>
        <label className="field">
          <span className="field-label">Your Solana wallet address</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Paste your address" autoComplete="off" spellCheck={false} inputMode="text" aria-invalid={!!errors.to} />
          {errors.to && <span className="field-error">{errors.to}</span>}
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Amount</span>
            <div className="amount">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25.00" inputMode="decimal" autoComplete="off" aria-invalid={!!errors.amount} />
              <span className="amount-unit">USDC</span>
            </div>
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </label>
          <label className="field">
            <span className="field-label">Your name <em>(optional)</em></span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ada's Studio" maxLength={48} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">What is it for <em>(optional)</em></span>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Logo design, invoice 014" maxLength={120} />
        </label>
        <button type="submit" className="btn btn-chrome btn-wide">Make my pay link</button>
        <p className="fine">Nothing is stored and nothing is signed here. Your link just carries your address and the amount. Double check the address: payments cannot be reversed.</p>
      </form>

      <div className={result ? "maker-out is-ready" : "maker-out"} aria-live="polite">
        {result ? (
          <>
            <div className="out-head">
              <span className="mono tag-mint">Link ready</span>
              <span className="out-amount">{displayAmount(result.req.amount)} <small>USDC</small></span>
            </div>
            <QR value={result.wallet} label="QR code: scan with a Solana wallet to pay" />
            {result.req.ref && <PayStatus to={result.req.to} amount={result.req.amount} refKey={result.req.ref} dark />}
            <p className="fine center">Scan with Phantom, Solflare or any Solana wallet to pay now.</p>
            <div className="linkbox mono">{result.page}</div>
            <div className="out-actions">
              <CopyButton text={result.page} label="Copy link" className="btn btn-chrome" />
              <a className="btn btn-outline" href={result.page} target="_blank" rel="noopener">Open pay page</a>
            </div>
            <div className="share">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}: ${result.page}`)}`} target="_blank" rel="noopener">WhatsApp</a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(result.page)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener">Telegram</a>
              <a href={`https://x.com/intent/post?text=${encodeURIComponent(`${shareText} ${result.page}`)}`} target="_blank" rel="noopener">X</a>
            </div>
          </>
        ) : (
          <div className="out-empty">
            <div className="out-empty-q" aria-hidden="true">Q</div>
            <p>Your link and QR code appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
