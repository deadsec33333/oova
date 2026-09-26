import type { Metadata } from "next";
import QR from "@/components/QR";
import CopyButton from "@/components/CopyButton";
import Coin from "@/components/Coin";
import Logo from "@/components/Logo";
import PayStatus from "@/components/PayStatus";
import { cleanText, displayAmount, isSolanaAddress, parseAmount, solanaPayUrl, shortAddress } from "@/lib/solanapay";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const p = await searchParams;
  const amount = parseAmount(one(p.amount));
  const label = cleanText(one(p.label), 48);
  const title = amount ? `Pay ${displayAmount(amount)} USDC${label ? ` to ${label}` : ""} · QOVA` : "QOVA pay link";
  return { title, description: "Pay with any Solana wallet. Wallet to wallet in USDC.", robots: { index: false } };
}

export default async function Pay({ searchParams }: { searchParams: SP }) {
  const p = await searchParams;
  const to = one(p.to).trim();
  const amount = parseAmount(one(p.amount));
  const label = cleanText(one(p.label), 48);
  const message = cleanText(one(p.message), 120);
  const refRaw = one(p.ref).trim();
  const ref = isSolanaAddress(refRaw) ? refRaw : undefined;
  const valid = isSolanaAddress(to) && !!amount;

  if (!valid) {
    return (
      <main className="pay">
        <div className="pay-card">
          <a href="/" className="brand"><Logo /></a>
          <h1 className="h2">This link is broken.</h1>
          <p className="lead">The address or the amount is missing or wrong. Ask the person for a new link.</p>
          <a href="/#make" className="btn btn-chrome btn-wide">Make your own link</a>
        </div>
      </main>
    );
  }

  const wallet = solanaPayUrl({ to, amount: amount!, label: label || undefined, message: message || undefined, ref });

  return (
    <main className="pay">
      <div className="pay-sky" aria-hidden="true" />
      <div className="pay-card">
        <a href="/" className="brand"><Logo /></a>
        <div className="pay-coin"><Coin size={96} /></div>
        <p className="kicker mono"><span className="sq" />Pay request</p>
        <h1 className="pay-amount">{displayAmount(amount!)} <small>USDC</small></h1>
        <p className="pay-to">to <b>{label || shortAddress(to)}</b></p>
        {label && <p className="pay-note">Name set by the person who made this link.</p>}
        {message && <p className="pay-msg">“{message}”</p>}

        {ref && <PayStatus to={to} amount={amount!} refKey={ref} />}
        <a href={wallet} className="btn btn-chrome btn-wide">Pay with a Solana wallet</a>
        <p className="fine center">On a computer? Scan this with your phone wallet.</p>
        <QR value={wallet} label="QR code for this payment" />

        <div className="pay-details">
          <div><span className="mono panel-k">Receiver address</span><span className="mono ca-v">{to}</span></div>
          <div className="pay-copy">
            <CopyButton text={to} label="Copy address" className="btn btn-outline btn-sm" />
            <CopyButton text={amount!} label="Copy amount" className="btn btn-outline btn-sm" />
          </div>
          <div><span className="mono panel-k">Token</span><span className="mono">USDC on Solana</span></div>
        </div>

        <p className="warn">Only pay people you know. Check the address with them. Crypto payments cannot be reversed. QOVA never holds money and cannot refund.</p>
        <a href="/#make" className="fine center link">Make your own link</a>
      </div>
    </main>
  );
}
