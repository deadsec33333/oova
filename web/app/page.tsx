import { Equal, Globe, Lock, QrCode, Share2, UserX, Wallet, Zap, Briefcase, House, Store, Palette } from "lucide-react";
import Coin from "@/components/Coin";
import Nav from "@/components/Nav";
import Logo from "@/components/Logo";
import Btn from "@/components/Btn";
import HeroOrbit from "@/components/HeroOrbit";
import WordRotator from "@/components/WordRotator";
import Loader from "@/components/Loader";
import Motion from "@/components/Motion";
import Story from "@/components/Story";
import WorldGlobe from "@/components/WorldGlobe";
import LinkMaker from "@/components/LinkMaker";
import CopyButton from "@/components/CopyButton";
import TokenIcon from "@/components/TokenIcon";
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
  ["What does it cost?", "The link is free. The payer pays the Solana network fee, usually under one cent. If your wallet has never held USDC, the first payment also opens a USDC account for it, about 0.002 SOL, paid once by the payer."],
  ["Which wallets work?", "Any wallet that supports Solana Pay, for example Phantom, Solflare and Backpack. On a phone, tap the link. On a computer, scan the QR code with your phone."],
  ["Is $QOVA a stablecoin?", "No. $QOVA is a memecoin. Its price moves and can go to zero. The dollars in QOVA pay links are USDC, not $QOVA."],
  ["Can I use a card or Apple Pay?", "Not yet. This version is wallet to wallet only. Card payments are being researched."],
];

export default function Home() {
  return (
    <>
      <Loader />
      <Motion />
      <Nav />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="hero-sky" aria-hidden="true" data-speed="-0.15" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="wrap hero-inner">
            <p className="kicker mono" data-intro><span className="sq" />USDC on Solana · wallet to wallet</p>
            <h1 className="display" data-intro>
              <span className="hl"><span className="hl-in">Dollars for</span></span>
              <span className="hl"><span className="hl-in"><WordRotator words={["everyone.", "freelancers.", "families.", "small shops.", "creators."]} /></span></span>
              <span className="hl"><span className="hl-in display-chrome">One link away.</span></span>
            </h1>
            <p className="lead" data-intro>Send a link. Anyone pays it. You get the exact amount in digital dollars, straight to your wallet.</p>
            <div className="cta-row" data-intro>
              <Btn href="#make" size="lg">Make your pay link</Btn>
              <Btn href="#how" variant="outline" size="lg">Watch it work</Btn>
            </div>

            <div className="hero-visual" data-intro>
              <div className="orbit" aria-hidden="true" />
              <HeroOrbit />
              <Coin size={210} />
              <div className="chip chip-a" aria-hidden="true">
                <TokenIcon kind="usdc" size={30} />
                <span><small className="mono">Link made · sample</small><b>25.00 USDC</b></span>
              </div>
              <div className="chip chip-b" aria-hidden="true">
                <span className="chip-ico">✓</span>
                <span><small className="mono">Arrived · sample</small><b>Lagos → Lima</b></span>
              </div>
            </div>
          </div>
        </section>

        <section className="truth" aria-label="What QOVA is" data-stagger>
          <div><span className="mono num">01</span><p><b>Pay links are free</b> and move USDC, a digital dollar designed to stay at 1 US dollar.</p></div>
          <div><span className="mono num">02</span><p><b>QOVA never holds your money.</b> Wallet to wallet, always.</p></div>
          <div><span className="mono num">03</span><p><b>$QOVA is a meme,</b> not a dollar. Its price moves.</p></div>
        </section>

        {/* STORY */}
        <Story />

        {/* BENTO */}
        <section className="bento-sec wrap" aria-label="Features">
          <p className="kicker mono" data-fade><span className="sq" />Built for real money</p>
          <h2 className="h2" data-split>Everything a pay link should be. Nothing it should not.</h2>
          <div className="bento">
            <article className="card card-wide" data-tilt data-fade>
              <div className="card-ico"><Equal size={20} /></div>
              <h3>The exact amount</h3>
              <p>You ask for 25.00, you get 25.00. The payer covers the tiny network fee.</p>
              <div className="mini mini-amount mono" aria-hidden="true"><span>25</span><span className="mini-dot">.</span><span className="mini-roll"><span>00</span><span>00</span></span><small>USDC</small></div>
            </article>
            <article className="card" data-tilt data-fade>
              <div className="card-ico"><QrCode size={20} /></div>
              <h3>QR for the counter</h3>
              <p>Print it. Tape it. Get paid in person.</p>
              <div className="mini mini-qr" aria-hidden="true"><div className="mini-qr-grid" /><div className="mini-scan" /></div>
            </article>
            <article className="card" data-tilt data-fade>
              <div className="card-ico"><Wallet size={20} /></div>
              <h3>Any Solana wallet</h3>
              <p>No app to install for your client.</p>
              <div className="mini mini-wallets" aria-hidden="true"><span>Phantom</span><span>Solflare</span><span>Backpack</span><span>Phantom</span></div>
            </article>
            <article className="card" data-tilt data-fade>
              <div className="card-ico"><Share2 size={20} /></div>
              <h3>Share anywhere</h3>
              <p>Chat, email, bio, invoice.</p>
              <div className="mini mini-bubbles" aria-hidden="true"><i /><i /><i /></div>
            </article>
            <article className="card" data-tilt data-fade>
              <div className="card-ico"><Lock size={20} /></div>
              <h3>Never custodial</h3>
              <p>No balance with us. Nothing to freeze, nothing to withdraw.</p>
              <div className="mini mini-lock" aria-hidden="true"><Lock size={34} /></div>
            </article>
            <article className="card card-wide card-dark" data-tilt data-fade>
              <div className="card-ico"><Zap size={20} /></div>
              <h3>No sign up. No bank hours.</h3>
              <p>Make a link in ten seconds, any day, any time zone.</p>
              <div className="stats" aria-hidden="true">
                <div><b>0</b><span className="mono">accounts to open</span></div>
                <div><b>1</b><span className="mono">link</span></div>
                <div><b>24/7</b><span className="mono">open</span></div>
                <div><b>&lt;$0.01</b><span className="mono">typical network fee</span></div>
              </div>
            </article>
          </div>
          <div className="works" data-fade>
            <span className="mono muted">Moves</span>
            <span className="works-chip"><TokenIcon kind="usdc" size={24} /> USDC</span>
            <span className="mono muted">on</span>
            <span className="works-chip"><TokenIcon kind="sol" size={24} /> Solana</span>
            <span className="mono muted">with</span>
            <span className="works-chip"><UserX size={16} /> no sign up</span>
          </div>
        </section>

        {/* DARK: WORLD + TOOL */}
        <section className="band" data-spotlight>
          <div className="band-spot" aria-hidden="true" />
          <div id="world" className="wrap world">
            <div className="world-copy">
              <p className="kicker mono kicker-dark"><span className="sq" />Worldwide</p>
              <h2 className="h2 h2-dark" data-split>One link. Any country.</h2>
              <p className="lead lead-dark" data-fade>Lagos to Lima. Manila to Nairobi. If they have a Solana wallet, they can pay you. Drag the globe.</p>
              <p className="mono fine world-note"><Globe size={14} /> Sample routes, not live data</p>
            </div>
            <WorldGlobe className="world-globe" />
          </div>

          <div id="make" className="wrap band-inner">
            <p className="kicker mono kicker-dark"><span className="sq" />Live tool · real USDC</p>
            <h2 className="h2 h2-dark" data-split>Make a pay link now.</h2>
            <p className="lead lead-dark" data-fade>Works today on Solana mainnet. Try it with a small amount first.</p>
            <div data-fade><LinkMaker /></div>
          </div>
        </section>

        {/* WHO */}
        <section className="who wrap" aria-label="Who it is for">
          <p className="kicker mono" data-fade><span className="sq" />For anyone paid from far away</p>
          <ul className="who-list" data-stagger>
            <li><span className="who-ico"><Briefcase size={20} /></span><span className="mono">Freelancers</span><p>Send one link with your invoice. Get paid in dollars, not in waiting.</p></li>
            <li><span className="who-ico"><House size={20} /></span><span className="mono">Families</span><p>Someone abroad taps the link. The money lands at home.</p></li>
            <li><span className="who-ico"><Store size={20} /></span><span className="mono">Small shops</span><p>Put the QR code on the counter. Sell to anyone with a wallet.</p></li>
            <li><span className="who-ico"><Palette size={20} /></span><span className="mono">Creators</span><p>Tips and commissions from any country, one link in your bio.</p></li>
          </ul>
        </section>

        {/* LORE */}
        <section className="lore" aria-label="The story">
          <div className="wrap">
            <p className="kicker mono" data-fade><span className="sq" />The coin with no face</p>
            <p className="lore-line" data-scrub>Every coin in history carried a face. A king, a president, a flag. Qova was struck with no face. Just a circle, and a tail that points to whoever needs it next. It closes the distance between work and pay.</p>
          </div>
        </section>

        {/* $QOVA */}
        <section id="coin" className="coinsec wrap">
          <div className="coinsec-text">
            <p className="kicker mono" data-fade><span className="sq" />$QOVA</p>
            <h2 className="h2" data-split>The meme behind the link.</h2>
            <p className="lead" data-fade>$QOVA is a community memecoin on Solana. It is not a dollar, not a stablecoin and not needed to use pay links. Its price moves and can go to zero.</p>
            <p className="warn mono" data-fade>We will never DM you a contract address. If it is not here and pinned on X, it is not us.</p>
          </div>
          <div className="panel" data-fade data-tilt>
            <div className="panel-top">
              <span className="panel-id"><TokenIcon kind="qova" size={28} /><span className="mono">Launch status</span></span>
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
            <div className="panel-row"><span className="mono panel-k">Market cap</span><span className="mono muted">live at launch</span></div>
            <div className="panel-row"><span className="mono panel-k">Holders</span><span className="mono muted">live at launch</span></div>
            <div className="chart" aria-label="Sample chart shape, not real data">
              <svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><path className="chart-line" d="M0 70 C30 64 40 72 60 60 S100 40 120 48 S160 30 180 36 S220 16 240 24 S280 10 300 14" /></svg>
              <span className="stamp mono">Preview · sample shape, not real data</span>
            </div>
          </div>
        </section>

        <section className="join wrap" aria-label="Community">
          <div>
            <p className="kicker mono" data-fade><span className="sq" />Community</p>
            <h2 className="h2" data-split>Be one of the Linked.</h2>
          </div>
          <div className="join-links" data-stagger>
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
          <p className="kicker mono" data-fade><span className="sq" />FAQ</p>
          <h2 className="h2" data-split>Plain answers.</h2>
          <div className="faq-list" data-stagger>
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
            <span className="brand"><Logo /></span>
            <Btn href="#make" variant="light" size="sm">Make a link</Btn>
          </div>
          <p className="disclaimer">$QOVA is a memecoin with no intrinsic value and no expectation of profit. It is not a dollar or a stablecoin and its price can go to zero. QOVA pay links are a free, non custodial demo: payments go straight between wallets and QOVA never holds, moves or converts money. USDC is issued by Circle, not by QOVA. Check the rules where you live. Not financial advice.</p>
        </div>
        <div className="foot-word" aria-hidden="true">QOVA</div>
      </footer>
    </>
  );
}
