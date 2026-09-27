"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ChevronRight, ExternalLink, House, KeyRound, Link2, LoaderCircle, LogOut, Mail, Plus, ShieldCheck, Wallet, WalletMinimal, Activity as ActivityIcon, Info,
} from "lucide-react";
import { Mark } from "@/components/Logo";
import TokenIcon from "@/components/TokenIcon";
import ThemeToggle from "@/components/ThemeToggle";
import Coin from "@/components/Coin";
import { payPageUrl, shortAddress } from "@/lib/solanapay";
import { watchWallets, walletBrowseLinks, type FoundWallet } from "@/lib/wallets";
import { signInError, signInWith, signOut as endSession, useAccount, type Phase } from "@/lib/account";
import AlertButton from "@/components/AlertButton";
import BalanceCard, { type Bal } from "@/components/app/BalanceCard";
import QuickLink from "@/components/app/QuickLink";
import LinksList from "@/components/app/LinksList";
import ActivityFeed from "@/components/app/ActivityFeed";
import LinkDetail from "@/components/app/LinkDetail";
import CounterMode from "@/components/app/CounterMode";
import WalletPanel from "@/components/app/WalletPanel";
import SoundSwitch from "@/components/app/SoundSwitch";
import { Sheet, fromMicro, micro, post, useReducedMotion, type LinkRec } from "@/components/app/shared";
export default function AppPage() {
  const me = useAccount();
  if (!me.loaded) return <main className="ax-loading" aria-busy="true"><Mark size={30} /></main>;
  if (!me.wallet) return <SignIn ready={me.ready} />;
  return <Dashboard wallet={me.wallet} onOut={endSession} />;
}

/* ─────────────── Sign in ─────────────── */

function SignIn({ ready }: { ready: boolean }) {
  const [method, setMethod] = useState<null | "wallet">(null);
  const [wallets, setWallets] = useState<FoundWallet[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [here, setHere] = useState("");

  useEffect(() => { setHere(window.location.href); return watchWallets(setWallets); }, []);

  async function go(w: FoundWallet) {
    setErr(""); setBusy(w.name);
    try { await signInWith(w, (p, m) => { setPhase(p); if (m) setMsg(m); }); }
    catch (e) { setErr(signInError(e)); setPhase("idle"); }
    finally { setBusy(null); }
  }

  const PH: Record<Phase, string> = { idle: "", connect: "Connecting to your wallet", sign: "Check your wallet and sign the message", verify: "Checking the signature" };

  return (
    <main className="ax-signin">
      <section className="ax-brand">
        <a href="/" className="ax-back"><ArrowLeft size={16} /> qova</a>
        <div className="ax-brand-coin"><Coin size={180} /></div>
        <div className="ax-brand-copy">
          <h1>Dollars for everyone.<br /><span>One link away.</span></h1>
          <p>Sign in to keep your links and see who paid. Money always goes wallet to wallet.</p>
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
          <p className="ax-sub">No password. Your wallet proves it is you by signing a free message.</p>

          {!ready && <p className="ax-err">Sign in is being set up. Check back soon.</p>}

          {method === null && (
            <div className="ax-methods">
              <button className="ax-m ax-m-main" disabled={!ready} onClick={() => setMethod("wallet")}><span className="ax-m-ico"><Wallet size={18} /></span><span><b>Continue with a wallet</b><small>Phantom, Solflare, Backpack</small></span><ChevronRight size={18} /></button>
              <div className="ax-or"><span>coming soon</span></div>
              <button className="ax-m" disabled><span className="ax-m-ico ax-g">G</span><span><b>Continue with Google</b><small>Not live yet</small></span><span className="ax-soon">Soon</span></button>
              <button className="ax-m" disabled><span className="ax-m-ico"><Mail size={18} /></span><span><b>Continue with email</b><small>Not live yet</small></span><span className="ax-soon">Soon</span></button>
            </div>
          )}

          {method === "wallet" && (
            <div className="ax-step">
              <button className="ax-backlink" onClick={() => { setMethod(null); setErr(""); }} disabled={!!busy}><ArrowLeft size={14} /> All options</button>

              {wallets === null ? (
                <p className="ax-sub">Looking for wallets…</p>
              ) : wallets.length ? (
                <div className="ax-wallets">
                  {wallets.map((w) => (
                    <button key={w.name} className="ax-w" onClick={() => go(w)} disabled={!!busy}>
                      <span className="ax-w-ico">{w.icon ? <img src={w.icon} alt="" width={32} height={32} /> : <WalletMinimal size={16} />}</span>
                      {w.name}
                      {busy === w.name ? <LoaderCircle size={16} className="ax-spin" /> : <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ax-nowallet">
                  <p><b>No wallet found in this browser.</b> On a phone, open this page inside your wallet app:</p>
                  <div className="ax-wallets">
                    {here && walletBrowseLinks(here).map((l) => (
                      <a key={l.name} className="ax-w" href={l.href}><span className="ax-w-ico"><WalletMinimal size={16} /></span>Open in {l.name}<ExternalLink size={15} /></a>
                    ))}
                  </div>
                  <p className="ax-fine">On a computer, add a wallet extension such as <a href="https://phantom.com" target="_blank" rel="noreferrer">Phantom</a> or <a href="https://solflare.com" target="_blank" rel="noreferrer">Solflare</a>, then reload.</p>
                </div>
              )}

              {phase !== "idle" && <p className="ax-phase" role="status"><LoaderCircle size={14} className="ax-spin" /> {PH[phase]}</p>}
              {err && <p className="ax-err" role="alert">{err}</p>}

              <div className="ax-msg">
                <div className="ax-msg-h"><KeyRound size={14} /><span className="mono">{msg ? "Message you are signing" : "What you will sign"}</span></div>
                <pre>{msg || `qova wants you to sign in with your Solana account:
<your address>

Sign in to QOVA. This is a free message. It is not a transaction and it cannot move funds.

Nonce: <one time code>`}</pre>
                <p className="ax-safe"><ShieldCheck size={14} /> QOVA will never ask you to sign a transaction to log in.</p>
              </div>
            </div>
          )}

          <p className="ax-legal">By continuing you accept the terms and the risk disclosure. $QOVA is a memecoin, not a dollar.</p>
        </div>
      </section>
    </main>
  );
}

/* ─────────────── Dashboard ─────────────── */

type Tab = "home" | "links" | "activity" | "wallet";
const TABS: [Tab, string, React.ReactNode][] = [
  ["home", "Home", <House key="h" size={19} />],
  ["links", "Links", <Link2 key="l" size={19} />],
  ["activity", "Activity", <ActivityIcon key="a" size={19} />],
  ["wallet", "Wallet", <Wallet key="w" size={19} />],
];
const TITLE: Record<Tab, string> = { home: "", links: "Links", activity: "Activity", wallet: "Wallet" };

function Dashboard({ wallet, onOut }: { wallet: string; onOut: () => void }) {
  const [links, setLinks] = useState<LinkRec[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTabRaw] = useState<Tab>("home");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [counter, setCounter] = useState<LinkRec | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [bal, setBal] = useState<Bal>({ state: "loading" });
  const [origin, setOrigin] = useState("");
  const [greet, setGreet] = useState("");
  const reduce = useReducedMotion();
  const linksNow = useRef<LinkRec[] | null>(null);
  linksNow.current = links;
  const balAt = useRef(0);

  const setTab = (t: Tab) => { setTabRaw(t); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/links", { cache: "no-store" });
      if (r.status === 401) return onOut();
      if (!r.ok) throw new Error();
      setLinks(((await r.json()) as { links: LinkRec[] }).links); setLoadErr("");
    } catch { setLoadErr("Could not load your links."); }
  }, [onOut]);

  // On chain USDC balance. Server caches it for about 30 s; we only ask on open, on return and after a payment.
  const loadBal = useCallback(async (force = false) => {
    if (!force && Date.now() - balAt.current < 30_000) return;
    balAt.current = Date.now();
    try {
      const r = await fetch("/api/wallet/balance", { cache: "no-store" });
      if (r.status === 401) return;
      const j = (await r.json()) as { usdc?: string };
      setBal(r.ok && typeof j.usdc === "string" ? { state: "ok", usdc: j.usdc } : (b) => (b.state === "ok" ? b : { state: "err" }));
    } catch { setBal((b) => (b.state === "ok" ? b : { state: "err" })); }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    const h = new Date().getHours();
    setGreet(h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    load(); loadBal(true);
    const vis = () => { if (document.visibilityState === "visible") loadBal(); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [load, loadBal]);

  // AccountHost is the one watcher for open links; the dashboard only reflects what it finds.
  useEffect(() => {
    const onPaid = async (e: Event) => {
      const d = (e as CustomEvent<{ link?: LinkRec; ref: string }>).detail;
      let l = d?.link;
      if (!l && d?.ref) {
        // Seen live on screen (counter QR): have the server confirm and save it too.
        const row = (linksNow.current ?? []).find((x) => x.ref === d.ref && x.status === "open");
        if (row) { try { l = ((await (await post(`/api/links/${row.id}/check`)).json()) as { link?: LinkRec }).link; } catch { /* next round */ } }
      }
      if (l?.status === "paid") setLinks((cur) => (cur ?? []).map((x) => (x.id === l!.id ? l! : x)));
      setTimeout(() => loadBal(true), 2500);
    };
    const reload = () => { load(); };
    window.addEventListener("qova:paid", onPaid);
    window.addEventListener("qova:links", reload);
    return () => { window.removeEventListener("qova:paid", onPaid); window.removeEventListener("qova:links", reload); };
  }, [load, loadBal]);

  async function remove(id: string) {
    try {
      const r = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (r.ok) { setLinks((cur) => (cur ?? []).filter((l) => l.id !== id)); return true; }
    } catch { /* fall through */ }
    return false;
  }

  const pageUrl = useCallback((l: LinkRec) => payPageUrl(origin, { to: l.to, amount: l.amount, label: l.label || undefined, message: l.message || undefined, ref: l.ref }), [origin]);
  const all = useMemo(() => links ?? [], [links]);
  const openCount = all.filter((l) => l.status === "open").length;
  const receivedAll = links ? fromMicro(all.filter((l) => l.status === "paid").reduce((s, l) => s + micro(l.amount), 0)) : null;
  const detail = detailId ? all.find((l) => l.id === detailId) ?? null : null;
  const counterLive = counter ? all.find((l) => l.id === counter.id) ?? counter : null;
  const made = (l: LinkRec) => { setLinks((cur) => [l, ...(cur ?? []).filter((x) => x.id !== l.id)]); window.dispatchEvent(new CustomEvent("qova:made")); };
  const openNew = () => setNewOpen(true);
  const openDetail = (l: LinkRec) => setDetailId(l.id);
  const openCounter = (l: LinkRec) => { setDetailId(null); setNewOpen(false); setCounter(l); };
  const quick = (autoFocus = false) => <QuickLink wallet={wallet} pageUrl={pageUrl} onMade={made} onCounter={openCounter} onSignedOut={onOut} autoFocus={autoFocus} />;

  return (
    <div className="ax-shell">
      <aside className="ax-side" aria-label="Main">
        <a href="/" className="ax-logo"><Mark size={22} /> QOVA</a>
        <button className="ax-btn ax-btn-main ax-side-new" onClick={openNew}><Plus size={16} /> New link</button>
        <nav className="ax-nav">
          {TABS.map(([k, n, i]) => <button key={k} className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>{i}<span>{n}</span>{k === "links" && links && openCount > 0 && <em>{openCount}</em>}</button>)}
        </nav>
        <div className="ax-side-note"><Info size={14} /><p>Early beta. Payments go wallet to wallet. $QOVA is a memecoin, not a dollar.</p></div>
        <div className="ax-user">
          <span className="ax-av"><Wallet size={16} /></span>
          <div><b>{shortAddress(wallet)}</b><span>Signed in</span></div>
          <button aria-label="Sign out" title="Sign out" onClick={onOut}><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="ax-main">
        <header className="ax-top">
          <a href="/" className="ax-logo ax-top-logo"><Mark size={20} /> QOVA</a>
          <div className="ax-top-t">
            {tab === "home"
              ? <><p className="mono ax-date">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1>{greet || " "}</h1></>
              : <><p className="mono ax-date">{shortAddress(wallet)}</p><h1>{TITLE[tab]}</h1></>}
          </div>
          <div className="ax-top-r">
            <AlertButton compact className="ax-icon" />
            <SoundSwitch />
            <ThemeToggle />
            <button className="ax-btn ax-btn-main ax-top-new" onClick={openNew}><Plus size={16} /> New link</button>
          </div>
        </header>
        <p className="ax-beta"><Info size={13} /> Early beta · payments go wallet to wallet · $QOVA is a memecoin, not a dollar</p>

        {loadErr && <p className="ax-err" role="alert">{loadErr} <button className="ax-linkbtn" onClick={load}>Try again</button></p>}

        <div className="ax-view" key={tab}>
          {tab === "home" && (
            <div className="ax-home">
              <BalanceCard links={links} bal={bal} openCount={openCount} total={all.length} reduce={reduce} />
              <section className="ax-tile ax-quick-card" aria-label="Quick link">
                <div className="ax-h"><h2>Quick link</h2><span className="mono">to {shortAddress(wallet)}</span></div>
                {quick()}
              </section>
              <LinksList links={links} compact onOpen={openDetail} onCounter={openCounter} onNew={openNew} onAll={() => setTab("links")} pageUrl={pageUrl} />
              <ActivityFeed links={links} compact onOpen={openDetail} onAll={() => setTab("activity")} />
            </div>
          )}
          {tab === "links" && <LinksList links={links} onOpen={openDetail} onCounter={openCounter} onNew={openNew} pageUrl={pageUrl} />}
          {tab === "activity" && <ActivityFeed links={links} onOpen={openDetail} />}
          {tab === "wallet" && <WalletPanel wallet={wallet} bal={bal} onRefresh={() => loadBal(true)} onSignOut={onOut} received={receivedAll} />}
        </div>
      </main>

      <nav className="ax-tabbar" aria-label="Main">
        {TABS.slice(0, 2).map(([k, n, i]) => <button key={k} className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>{i}<span>{n}</span></button>)}
        <button className="ax-tab-new" onClick={openNew} aria-label="New link"><Plus size={22} /></button>
        {TABS.slice(2).map(([k, n, i]) => <button key={k} className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>{i}<span>{n}</span></button>)}
      </nav>

      {newOpen && (
        <Sheet label="New pay link" onClose={() => setNewOpen(false)}>
          <div className="ax-det">
            <p className="mono ax-det-top-c">New pay link</p>
            <h2 className="ax-det-name">How much?</h2>
            {quick(true)}
          </div>
        </Sheet>
      )}
      {detail && <LinkDetail key={detail.id} l={detail} pageUrl={pageUrl} onClose={() => setDetailId(null)} onCounter={openCounter} onDelete={remove} onUpdate={(l) => setLinks((cur) => (cur ?? []).map((x) => (x.id === l.id ? l : x)))} />}
      {counterLive && <CounterMode link={counterLive} onClose={() => setCounter(null)} onNew={() => { setCounter(null); setNewOpen(true); }} />}
    </div>
  );
}
