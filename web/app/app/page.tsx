"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowLeft, Bell, Check, ChevronRight, Copy, ExternalLink, House, KeyRound, Link2, LogOut, Mail,
  Plus, QrCode, Search, Settings, ShieldCheck, Wallet, WalletMinimal, X, Activity as ActivityIcon, Sparkles,
} from "lucide-react";
import { Mark } from "@/components/Logo";
import TokenIcon from "@/components/TokenIcon";
import ThemeToggle from "@/components/ThemeToggle";
import Coin from "@/components/Coin";

type View = "signin" | "dash";
type Method = null | "wallet" | "google" | "email";

const WALLETS = ["Phantom", "Solflare", "Backpack", "Other Solana wallet"];
const LINKS = [
  { l: "Logo design · Ada Studio", a: "250.00", s: "Paid", d: "Today" },
  { l: "Website retainer, October", a: "1,200.00", s: "Open", d: "Yesterday" },
  { l: "Tip jar", a: "Any", s: "Open", d: "12 Sep" },
  { l: "Poster print x3", a: "45.00", s: "Paid", d: "9 Sep" },
  { l: "Consulting call", a: "80.00", s: "Expired", d: "2 Sep" },
];
const ACTIVITY = [
  { f: "4Nd2…Qp7", c: "Manila", a: "+250.00", t: "2 min ago" },
  { f: "9kLa…3rT", c: "Lagos", a: "+45.00", t: "Yesterday" },
  { f: "Hq7Z…m2P", c: "Lima", a: "+120.00", t: "6 Sep" },
  { f: "2bXe…Kw9", c: "Nairobi", a: "+15.00", t: "3 Sep" },
];
const SPARK = [12, 18, 14, 22, 30, 26, 34, 31, 42, 38, 47, 55, 50, 62];

function Spark() {
  const w = 300, h = 80, max = Math.max(...SPARK), min = Math.min(...SPARK);
  const pts = SPARK.map((v, i) => [(i / (SPARK.length - 1)) * w, h - ((v - min) / (max - min)) * (h - 10) - 5]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg className="ax-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="axsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="url(#axsg)" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="ax-spark-line" />
    </svg>
  );
}

export default function AppPreview() {
  const [view, setView] = useState<View>("signin");
  const [method, setMethod] = useState<Method>(null);
  const [tab, setTab] = useState("Home");
  const nonce = useMemo(() => Math.random().toString(36).slice(2, 10).toUpperCase(), []);
  const issued = useMemo(() => new Date().toISOString().slice(0, 16).replace("T", " "), []);

  if (view === "signin") {
    return (
      <main className="ax-signin">
        <section className="ax-brand">
          <a href="/" className="ax-back"><ArrowLeft size={16} /> qova</a>
          <div className="ax-brand-coin"><Coin size={180} /></div>
          <div className="ax-brand-copy">
            <h1>Dollars for everyone.<br /><span>One link away.</span></h1>
            <p>Sign in to keep your links, see who paid and add more wallets.</p>
          </div>
          <div className="ax-notes" aria-hidden="true">
            <div className="ax-note"><TokenIcon kind="usdc" size={30} /><div><b>+250.00 USDC</b><span>from Manila · sample</span></div></div>
            <div className="ax-note"><Link2 size={16} /><div><b>Link opened</b><span>Website retainer · sample</span></div></div>
          </div>
        </section>

        <section className="ax-panel">
          <div className="ax-card">
            <div className="ax-card-top"><span className="ax-logo"><Mark size={22} /> QOVA</span><ThemeToggle /></div>
            <h2>Sign in</h2>
            <p className="ax-sub">No password. Use a wallet or an account you already have.</p>

            {method === null && (
              <div className="ax-methods">
                <button className="ax-m ax-m-main" onClick={() => setMethod("wallet")}><span className="ax-m-ico"><Wallet size={18} /></span><span><b>Continue with a wallet</b><small>Phantom, Solflare, Backpack</small></span><ChevronRight size={18} /></button>
                <div className="ax-or"><span>or</span></div>
                <button className="ax-m" onClick={() => setMethod("google")}><span className="ax-m-ico ax-g">G</span><span><b>Continue with Google</b><small>We only read your name and email</small></span><ChevronRight size={18} /></button>
                <button className="ax-m" onClick={() => setMethod("email")}><span className="ax-m-ico"><Mail size={18} /></span><span><b>Continue with email</b><small>We send a one time link</small></span><ChevronRight size={18} /></button>
              </div>
            )}

            {method === "wallet" && (
              <div className="ax-step">
                <button className="ax-backlink" onClick={() => setMethod(null)}><ArrowLeft size={14} /> All options</button>
                <div className="ax-wallets">{WALLETS.map((w) => <button key={w} className="ax-w"><span className="ax-w-ico"><WalletMinimal size={16} /></span>{w}<ChevronRight size={16} /></button>)}</div>
                <div className="ax-msg">
                  <div className="ax-msg-h"><KeyRound size={14} /><span className="mono">Message you will sign</span></div>
                  <pre>{`qova wants you to sign in with your Solana account:
7xKX…9fQ2

This is a free message. It is not a transaction
and it cannot move funds.

Nonce: ${nonce}
Issued: ${issued} UTC`}</pre>
                  <p className="ax-safe"><ShieldCheck size={14} /> QOVA will never ask you to sign a transaction to log in.</p>
                </div>
              </div>
            )}

            {method === "google" && (
              <div className="ax-step">
                <button className="ax-backlink" onClick={() => setMethod(null)}><ArrowLeft size={14} /> All options</button>
                <div className="ax-oauth"><span className="ax-m-ico ax-g">G</span><div><b>Google</b><span>Shares: name, email, profile photo</span></div></div>
                <p className="ax-sub">You can link a wallet after you sign in. Payments always go to a wallet you control, never to a QOVA account.</p>
              </div>
            )}

            {method === "email" && (
              <div className="ax-step">
                <button className="ax-backlink" onClick={() => setMethod(null)}><ArrowLeft size={14} /> All options</button>
                <label className="ax-field"><span>Email</span><input type="email" placeholder="you@studio.com" /></label>
                <p className="ax-sub">We send a one time sign in link. No password to remember.</p>
              </div>
            )}

            <div className="ax-preview">
              <Sparkles size={15} />
              <span><b>Design preview.</b> Sign in is not live yet, nothing connects.</span>
              <button onClick={() => setView("dash")}>See the dashboard <ChevronRight size={14} /></button>
            </div>
            <p className="ax-legal">By continuing you accept the terms and the risk disclosure. $QOVA is a memecoin, not a dollar.</p>
          </div>
        </section>
      </main>
    );
  }

  const NAV: [string, React.ReactNode][] = [["Home", <House key="h" size={18} />], ["Links", <Link2 key="l" size={18} />], ["Activity", <ActivityIcon key="a" size={18} />], ["Wallets", <Wallet key="w" size={18} />], ["Settings", <Settings key="s" size={18} />]];

  return (
    <div className="ax-shell">
      <aside className="ax-side">
        <a href="/" className="ax-logo"><Mark size={22} /> QOVA</a>
        <nav className="ax-nav">{NAV.map(([n, i]) => <button key={n} className={tab === n ? "is-on" : ""} onClick={() => setTab(n)}>{i}<span>{n}</span></button>)}</nav>
        <div className="ax-user">
          <span className="ax-av">A</span>
          <div><b>Ada Studio</b><span className="mono">Google · 7xKX…9fQ2</span></div>
          <button aria-label="Sign out" onClick={() => { setView("signin"); setMethod(null); }}><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="ax-main">
        <div className="ax-banner"><Sparkles size={14} /> Design preview · sample data · nothing here is real yet</div>
        <header className="ax-top">
          <div><p className="mono ax-date">Saturday · sample account</p><h1>Good evening, Ada</h1></div>
          <div className="ax-top-r">
            <label className="ax-search"><Search size={16} /><input placeholder="Search links" /></label>
            <button className="ax-icon" aria-label="Notifications"><Bell size={18} /><i /></button>
            <ThemeToggle />
            <a href="/#make" className="ax-new"><Plus size={16} /> New link</a>
          </div>
        </header>

        <div className="ax-grid">
          <section className="ax-card2 ax-bal">
            <div className="ax-bal-h"><span className="mono">Received this month</span><span className="ax-pill">+18% vs last · sample</span></div>
            <div className="ax-bal-v"><TokenIcon kind="usdc" size={36} /><b>1,430.00</b><small>USDC</small></div>
            <Spark />
            <div className="ax-bal-f"><span><b>12</b> payments</span><span><b>4</b> open links</span><span><b>6</b> countries</span></div>
          </section>

          <section className="ax-card2 ax-quick">
            <div className="ax-h"><b>Quick link</b><span className="mono">to Phantom · 7xKX…9fQ2</span></div>
            <div className="ax-q-amt"><input defaultValue="25.00" aria-label="Amount" /><span className="mono">USDC</span></div>
            <input className="ax-q-for" placeholder="What is it for" defaultValue="Logo revisions" aria-label="What is it for" />
            <a href="/#make" className="ax-q-btn"><Link2 size={16} /> Create link</a>
            <p className="ax-fine">Wallet to wallet. We never hold your money.</p>
          </section>

          <section className="ax-card2 ax-links">
            <div className="ax-h"><b>Your pay links</b><button className="ax-text">View all <ChevronRight size={14} /></button></div>
            <div className="ax-table">
              {LINKS.map((r) => (
                <div key={r.l} className="ax-row">
                  <span className="ax-row-ico"><Link2 size={15} /></span>
                  <div className="ax-row-t"><b>{r.l}</b><span className="mono">{r.d}</span></div>
                  <span className="ax-row-a">{r.a}{r.a !== "Any" && <small> USDC</small>}</span>
                  <span className={`ax-status ax-s-${r.s.toLowerCase()}`}>{r.s === "Paid" && <Check size={12} strokeWidth={3} />}{r.s}</span>
                  <span className="ax-row-act"><button aria-label="Copy link"><Copy size={15} /></button><button aria-label="Show QR"><QrCode size={15} /></button></span>
                </div>
              ))}
            </div>
          </section>

          <section className="ax-card2 ax-act">
            <div className="ax-h"><b>Activity</b><span className="ax-live"><i /> Live</span></div>
            <ul>
              {ACTIVITY.map((x) => (
                <li key={x.f}><span className="ax-in"><ArrowDownLeft size={15} /></span><div><b>{x.a} USDC</b><span className="mono">{x.f} · {x.c} · {x.t}</span></div><button aria-label="View on explorer"><ExternalLink size={14} /></button></li>
              ))}
            </ul>
          </section>

          <section className="ax-card2 ax-acc">
            <div className="ax-h"><b>Connected accounts</b></div>
            <div className="ax-acc-row"><span className="ax-m-ico ax-g">G</span><div><b>Google</b><span className="mono">ada@studio.com</span></div><span className="ax-ok"><Check size={12} strokeWidth={3} /> Signed in</span></div>
            <div className="ax-acc-row"><span className="ax-m-ico"><Wallet size={16} /></span><div><b>Phantom</b><span className="mono">7xKX…9fQ2 · receives payments</span></div><span className="ax-ok ax-primary">Primary</span></div>
            <button className="ax-add"><Plus size={16} /> Add another wallet</button>
            <p className="ax-fine"><ShieldCheck size={13} /> Wallets are linked by signing a free message. Never a transaction.</p>
          </section>
        </div>
      </div>

      <nav className="ax-tabbar">{NAV.map(([n, i]) => <button key={n} className={tab === n ? "is-on" : ""} onClick={() => setTab(n)}>{i}<span>{n}</span></button>)}</nav>
    </div>
  );
}
