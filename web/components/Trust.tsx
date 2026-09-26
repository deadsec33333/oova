import { Ban, BookOpen, KeyRound, Network, ScanSearch, ShieldCheck, Wallet, WalletMinimal } from "lucide-react";
import { Mark } from "./Logo";
import TokenIcon from "./TokenIcon";
import LinkAnatomy from "./LinkAnatomy";

/** Safe by design: how money moves, what QOVA can and cannot do. */
export default function Trust() {
  return (
    <section id="trust" className="trust wrap" data-nav="Security" aria-label="Security">
      <div className="trust-top">
        <div>
          <p className="kicker mono" data-fade><span className="sq" />Safe by design</p>
          <h2 className="h2" data-split>Your money never touches us.</h2>
        </div>
        <p className="lead" data-fade>QOVA writes a link. Your client&apos;s wallet sends USDC straight to yours on Solana. We never hold funds, never ask for keys and there is nothing to sign on this site.</p>
      </div>

      <div className="flow2" data-fade aria-label="Money goes from the payer's wallet over Solana to your wallet. QOVA is not in the path.">
        <div className="f2-node"><span className="f2-ico"><Wallet size={20} /></span><b>Payer&apos;s wallet</b><span className="mono">Phantom · Solflare · any</span></div>
        <div className="f2-wire" aria-hidden="true"><span className="f2-pkt"><TokenIcon kind="usdc" size={26} /></span><span className="f2-pkt f2-pkt-2"><TokenIcon kind="usdc" size={22} /></span></div>
        <div className="f2-node f2-mid"><span className="f2-ico"><Network size={20} /></span><b>Solana network</b><span className="mono">public, settles in seconds</span></div>
        <div className="f2-wire" aria-hidden="true"><span className="f2-pkt f2-pkt-3"><TokenIcon kind="usdc" size={26} /></span></div>
        <div className="f2-node f2-end"><span className="f2-ico"><WalletMinimal size={20} /></span><b>Your wallet</b><span className="mono">exact amount, yours</span></div>
        <div className="f2-q" aria-hidden="true">
          <span className="f2-q-line" />
          <div className="f2-qbox"><Mark size={18} /><div><b>QOVA</b><span className="mono">writes the link only</span></div><span className="f2-ban"><Ban size={16} /> no access to funds</span></div>
        </div>
      </div>

      <div className="pillars" data-stagger>
        <article className="pillar"><ShieldCheck size={22} /><h3>Non custodial</h3><p>No balance with us. Nothing to freeze, nothing to hack, nothing to withdraw.</p></article>
        <article className="pillar"><KeyRound size={22} /><h3>No keys, no signing</h3><p>Making a link needs no wallet connection. We never ask for a seed phrase. Ever.</p></article>
        <article className="pillar"><BookOpen size={22} /><h3>Open standard</h3><p>Links follow Solana Pay, a public spec that major Solana wallets support.</p></article>
        <article className="pillar"><ScanSearch size={22} /><h3>Public receipts</h3><p>Every payment is visible on Solana explorers. Anyone can check it.</p></article>
      </div>

      <div data-fade><LinkAnatomy /></div>
    </section>
  );
}
