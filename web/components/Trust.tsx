import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Compare from "./Compare";
import Zeros from "./Zeros";
import LinkAnatomy from "./LinkAnatomy";

/** Safe by design. The feeling: we can't touch your money, and you can check that yourself. */
export default function Trust() {
  return (
    <section id="trust" className="trust2" data-nav="Security" aria-label="Security" data-spotlight>
      <div className="t2-glow" aria-hidden="true" />
      <div className="wrap t2-head">
        <p className="kicker mono kicker-dark"><span className="sq" />Safe by design</p>
        <h2 className="t2-title" data-scrub>We can&apos;t touch your money.</h2>
        <p className="t2-sub" data-fade>Not won&apos;t. <b>Can&apos;t.</b></p>
        <p className="t2-lead" data-fade>QOVA only writes the link. The payment goes from your client&apos;s wallet straight into yours on Solana. There is no QOVA account in the middle, so there is nothing for us, or anyone who hacks us, to hold, freeze or take.</p>
      </div>

      <div className="wrap" data-fade><Compare /></div>

      <div className="wrap" data-fade><Zeros /></div>

      <div className="wrap t2-verify">
        <div className="t2-v-copy">
          <p className="kicker mono kicker-dark"><span className="sq" />Check, don&apos;t trust</p>
          <h3 data-split>Don&apos;t trust us. Verify.</h3>
          <p>Every QOVA link is plain, readable data. Every payment leaves a public receipt on Solana that anyone can look up. Here is exactly what a link contains.</p>
          <div className="t2-v-links">
            <a href="https://docs.solanapay.com" target="_blank" rel="noopener">Solana Pay spec <ArrowUpRight size={14} /></a>
            <a href="https://www.circle.com/usdc" target="_blank" rel="noopener">About USDC <ArrowUpRight size={14} /></a>
            <span><ShieldCheck size={14} /> We will never DM you or ask for a seed phrase</span>
          </div>
        </div>
        <div data-fade><LinkAnatomy /></div>
      </div>
    </section>
  );
}
