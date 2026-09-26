import Coin from "@/components/Coin";
import DotGlobe from "@/components/DotGlobe";
import LinkMaker from "@/components/LinkMaker";
import CopyButton from "@/components/CopyButton";
import { launch } from "@/lib/launch";

const socials: { name: string; href: string }[] = [
  { name: "X", href: launch.links.x },
  { name: "Telegram", href: launch.links.telegram },
  { name: "TikTok", href: launch.links.tiktok },
  { name: "Instagram", href: launch.links.instagram },
];

const faq = [
  ["Do I need $QOVA to use a pay link?", "No. Pay links move USDC, a digital dollar issued by Circle. They work for anyone with a Solana wallet, with or without the coin."],
  ["Does QOVA hold my money?", "Never. The payer's wallet sends USDC straight to your wallet. QOVA only writes the link. There is no account, no balance and nothing to withdraw."],
  ["What does it cost?", "The link is free. The payer pays the Solana network fee, usually a fraction of a cent. If your wallet has never held USDC, the first payment also opens a USDC account for it, about 0.002 SOL, paid once by the payer."],
  ["Which wallets work?", "Any wallet that supports Solana Pay, for example Phantom, Solflare and Backpack. On a phone, tap the link. On a computer, scan the QR code with your phone."],
  ["Is $QOVA a stablecoin?", "No. $QOVA is a memecoin. Its price moves and can go to zero. The dollars in QOVA pay links are USDC, not $QOVA."],
  ["Can I use a card or Apple Pay?", "Not yet. This version is wallet to wallet only. Card payments are being researched."],
];

export default function Home() {
  return (
    <>
      <header className="nav">
        <a href="#top" className="brand" aria-label="QOVA home">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-word">QOVA</span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#make">Pay link</a>
          <a href="#coin">$QOVA</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href="#make" className="btn btn-chrome btn-sm">Make a link</a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-sky" aria-hidden="true" />
          <div className="wrap hero-inner">
            <p className="kicker mono"><span className="sq" />USDC on Solana · wallet to wallet</p>
            <h1 className="display">
              Dollars for everyone.<br />
              <span className="display-chrome">One link away.</span>
            </h1>
            <p className="lead">Send a link. Anyone pays it. You get the exact amount in digital dollars, straight to your wallet.</p>
            <div className="cta-row">
              <a href="#make" className="btn btn-chrome">Make your pay link <span aria-hidden="true">↗</span></a>
              <a href="#how" className="btn btn-ghost">How it works <span aria-hidden="true">→</span></a>
            </div>

            <div className="hero-visual">
              <div className="orbit" aria-hidden="true" />
              <Coin size={200} />
              <div className="chip chip-a" aria-hidden="true">
                <span className="chip-ico">↗</span>
                <span><small className="mono">Link made · sample</small><b>25.00 USDC</b></span>
              </div>
              <div className="chip chip-b" aria-hidden="true">
                <span className="chip-ico chip-ico-mint">✓</span>
                <span><small className="mono">Arrived · sample</small><b>Lagos → Lima</b></span>
              </div>
            </div>
          </div>
        </section>

        <section className="truth" aria-label="What QOVA is">
          <div><span className="mono num">01</span><p><b>Pay links are free</b> and move USDC, a digital dollar.</p></div>
          <div><span className="mono num">02</span><p><b>QOVA never holds your money.</b> Wallet to wallet, always.</p></div>
          <div><span className="mono num">03</span><p><b>$QOVA is a meme,</b> not a dollar. Its price moves.</p></div>
        </section>

        <section id="how" className="how wrap">
          <p className="kicker mono"><span className="sq" />How it works</p>
          <h2 className="h2">Three steps. No sign up.</h2>
          <div className="flow">
            <div className="node">
              <span className="mono node-k">01 / Your link</span>
              <b>Type your address and an amount</b>
              <span className="mono node-v">qova/pay?amount=25</span>
            </div>
            <div className="wire" aria-hidden="true"><i /></div>
            <div className="node">
              <span className="mono node-k">02 / Any Solana wallet</span>
              <b>They tap the link or scan the code</b>
              <span className="mono node-v">Phantom · Solflare · Backpack</span>
            </div>
            <div className="wire" aria-hidden="true"><i /></div>
            <div className="node node-mint">
              <span className="mono node-k">03 / USDC to you</span>
              <b>You get the exact amount</b>
              <span className="mono node-v">usually within seconds</span>
            </div>
          </div>
        </section>

        <section id="make" className="band">
          <DotGlobe className="band-globe" />
          <div className="wrap band-inner">
            <p className="kicker mono kicker-dark"><span className="sq" />Live tool · real USDC</p>
            <h2 className="h2 h2-dark">Make a pay link now.</h2>
            <p className="lead lead-dark">Works today on Solana mainnet. Try it with a small amount first.</p>
            <LinkMaker />
          </div>
        </section>

        <section className="who wrap" aria-label="Who it is for">
          <p className="kicker mono"><span className="sq" />For anyone paid from far away</p>
          <ul className="who-list">
            <li><span className="mono">Freelancers</span><p>Send one link with your invoice. Get paid in dollars, not in waiting.</p></li>
            <li><span className="mono">Families</span><p>Someone abroad taps the link. The money lands at home.</p></li>
            <li><span className="mono">Small shops</span><p>Put the QR code on the counter. Sell to anyone with a wallet.</p></li>
            <li><span className="mono">Creators</span><p>Tips and commissions from any country, one link in your bio.</p></li>
          </ul>
        </section>

        <section className="lore" aria-label="The story">
          <div className="wrap">
            <p className="kicker mono"><span className="sq" />The coin with no face</p>
            <p className="lore-line">Every coin in history carried a face. A king, a president, a flag.</p>
            <p className="lore-line lore-mute">Qova was struck with no face. Just a circle, and a tail that points to whoever needs it next.</p>
            <p className="lore-line">It closes the distance between work and pay.</p>
          </div>
        </section>

        <section id="coin" className="coinsec wrap">
          <div className="coinsec-text">
            <p className="kicker mono"><span className="sq" />$QOVA</p>
            <h2 className="h2">The meme behind the link.</h2>
            <p className="lead">$QOVA is a community memecoin on Solana. It is not a dollar, not a stablecoin and not needed to use pay links. Its price moves and can go to zero.</p>
            <p className="warn mono">We will never DM you a contract address. If it is not here and pinned on X, it is not us.</p>
          </div>
          <div className="panel">
            <div className="panel-top">
              <span className="mono">Launch status</span>
              <span className={launch.live ? "pill pill-live" : "pill"}>{launch.live ? "Live" : "Preview"}</span>
            </div>
            <div className="panel-row">
              <span className="mono panel-k">Contract</span>
              {launch.live ? (
                <div className="ca"><span className="mono ca-v">{launch.ca}</span><CopyButton text={launch.ca} label="Copy" className="btn btn-outline btn-sm" /></div>
              ) : (
                <div className="ca"><span className="mono ca-v muted">NOT DEPLOYED YET</span><button className="btn btn-outline btn-sm" disabled>Copy</button></div>
              )}
            </div>
            <div className="panel-row">
              <span className="mono panel-k">Market cap</span><span className="mono muted">live at launch</span>
            </div>
            <div className="panel-row">
              <span className="mono panel-k">Holders</span><span className="mono muted">live at launch</span>
            </div>
            <div className="chart" aria-label="Sample chart shape, not real data">
              <svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><path className="chart-line" d="M0 70 C30 64 40 72 60 60 S100 40 120 48 S160 30 180 36 S220 16 240 24 S280 10 300 14" /></svg>
              <span className="stamp mono">Preview · sample shape, not real data</span>
            </div>
          </div>
        </section>

        <section className="join wrap" aria-label="Community">
          <div>
            <p className="kicker mono"><span className="sq" />Community</p>
            <h2 className="h2">Be one of the Linked.</h2>
          </div>
          <div className="join-links">
            {socials.map((s) =>
              s.href ? (
                <a key={s.name} className="btn btn-outline" href={s.href} target="_blank" rel="noopener">{s.name}</a>
              ) : (
                <span key={s.name} className="btn btn-outline is-soon" aria-disabled="true">{s.name} <small>soon</small></span>
              )
            )}
          </div>
        </section>

        <section id="faq" className="faq wrap">
          <p className="kicker mono"><span className="sq" />FAQ</p>
          <h2 className="h2">Plain answers.</h2>
          <div className="faq-list">
            {faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <span className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-word">QOVA</span></span>
            <span className="mono muted">One link away.</span>
          </div>
          <p className="disclaimer">$QOVA is a memecoin with no intrinsic value and no expectation of profit. It is not a dollar or a stablecoin and its price can go to zero. QOVA pay links are a free, non custodial demo: payments go straight between wallets and QOVA never holds, moves or converts money. USDC is issued by Circle, not by QOVA. Check the rules where you live. Not financial advice.</p>
        </div>
      </footer>
    </>
  );
}
