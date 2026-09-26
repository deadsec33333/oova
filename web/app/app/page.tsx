"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft, ArrowLeft, Check, ChevronRight, Copy, ExternalLink, House, KeyRound, Link2, LoaderCircle, LogOut, Mail,
  Plus, QrCode, Search, Settings, ShieldCheck, Trash2, Wallet, WalletMinimal, X, Activity as ActivityIcon, Sparkles,
} from "lucide-react";
import { Mark } from "@/components/Logo";
import TokenIcon from "@/components/TokenIcon";
import ThemeToggle from "@/components/ThemeToggle";
import Coin from "@/components/Coin";
import QR from "@/components/QR";
import { displayAmount, payPageUrl, shortAddress, solanaPayUrl } from "@/lib/solanapay";
import { watchWallets, walletBrowseLinks, type FoundWallet } from "@/lib/wallets";

type Me = { wallet: string | null; ready: boolean };
type LinkRec = {
  id: string; to: string; amount: string; label: string; message: string; ref: string; createdAt: number; status: "open" | "paid";
  paid?: { signature: string; payer: string | null; blockTime: number | null; exact: boolean };
};

const post = (url: string, body?: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

function when(ms: number) {
  const d = Date.now() - ms, m = Math.round(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48) return "Yesterday";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
const micro = (a: string) => { const [i, f = ""] = a.split("."); return Number(i) * 1e6 + Number((f + "000000").slice(0, 6)); };
const fromMicro = (n: number) => displayAmount((n / 1e6).toFixed(6).replace(/0{1,4}$/, ""));

export default function AppPage() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => setMe({ wallet: null, ready: false }));
  }, []);
  if (!me) return <main className="ax-loading" aria-busy="true"><Mark size={30} /></main>;
  if (!me.wallet) return <SignIn ready={me.ready} onIn={(w) => setMe({ wallet: w, ready: true })} />;
  return <Dashboard wallet={me.wallet} onOut={() => setMe({ wallet: null, ready: true })} />;
}

/* ─────────────── Sign in ─────────────── */

type Phase = "idle" | "connect" | "sign" | "verify";

function SignIn({ ready, onIn }: { ready: boolean; onIn: (w: string) => void }) {
  const [method, setMethod] = useState<null | "wallet">(null);
  const [wallets, setWallets] = useState<FoundWallet[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [here, setHere] = useState("");

  useEffect(() => { setHere(window.location.href); return watchWallets(setWallets); }, []);

  async function go(w: FoundWallet) {
    setErr(""); setBusy(w.name); setPhase("connect");
    try {
      const address = await w.connect();
      const r = await post("/api/auth/nonce", { wallet: address });
      if (r.status === 429) throw new Error("slow");
      if (!r.ok) throw new Error("server");
      const { message } = (await r.json()) as { message: string };
      setMsg(message); setPhase("sign");
      const signature = await w.signMessage(address, message);
      setPhase("verify");
      const v = await post("/api/auth/verify", { wallet: address, message, signature });
      if (!v.ok) throw new Error("verify");
      window.dispatchEvent(new CustomEvent("qova:made"));
      onIn(address);
    } catch (e) {
      const t = e instanceof Error ? e.message : "";
      setErr(
        t === "slow" ? "Too many tries. Wait a minute and try again." :
        t === "server" ? "Sign in is not available right now. Try again soon." :
        t === "verify" ? "That signature did not check out. Nothing happened, try again." :
        "Cancelled in the wallet. Nothing was signed."
      );
      setPhase("idle");
    } finally { setBusy(null); }
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

function Spark({ points }: { points: number[] }) {
  const w = 300, h = 80;
  if (points.length < 2) return <div className="ax-spark ax-spark-empty"><span>Your first payments will draw this line.</span></div>;
  const max = Math.max(...points), min = Math.min(0, ...points);
  const pts = points.map((v, i) => [(i / (points.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 10) - 5]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg className="ax-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="axsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="url(#axsg)" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="ax-spark-line" />
    </svg>
  );
}

function CopyIcon({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button aria-label={label} title={label} onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); } catch { /* ignore */ } }}>
      {ok ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

function Dashboard({ wallet, onOut }: { wallet: string; onOut: () => void }) {
  const [links, setLinks] = useState<LinkRec[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState("Home");
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [making, setMaking] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [qr, setQr] = useState<LinkRec | null>(null);
  const [sure, setSure] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const linksRef = useRef<LinkRec[]>([]);
  linksRef.current = links ?? [];

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/links", { cache: "no-store" });
      if (r.status === 401) return onOut();
      if (!r.ok) throw new Error();
      setLinks(((await r.json()) as { links: LinkRec[] }).links); setLoadErr("");
    } catch { setLoadErr("Could not load your links. Retrying."); }
  }, [onOut]);

  useEffect(() => { setOrigin(window.location.origin); load(); }, [load]);

  // Watch open links on Solana while this tab is visible.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const open = linksRef.current.filter((l) => l.status === "open").slice(0, 10);
      for (const l of open) {
        if (stop) return;
        try {
          const r = await post(`/api/links/${l.id}/check`);
          const j = (await r.json()) as { link?: LinkRec };
          if (j.link?.status === "paid") {
            setLinks((cur) => (cur ?? []).map((x) => (x.id === l.id ? j.link! : x)));
            window.dispatchEvent(new CustomEvent("qova:made"));
          }
        } catch { /* try next round */ }
      }
    };
    const first = setTimeout(tick, 1200);
    const iv = setInterval(tick, 20000);
    return () => { stop = true; clearTimeout(first); clearInterval(iv); };
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(""); setMaking(true);
    try {
      const r = await post("/api/links", { amount, label });
      const j = (await r.json()) as { link?: LinkRec; error?: string };
      if (!r.ok || !j.link) {
        setFormErr(j.error === "amount" ? "Enter an amount above 0, up to 6 decimals." : j.error === "slow_down" ? "Slow down a little and try again." : j.error === "signin" ? "Please sign in again." : "Could not save the link. Try again.");
        if (j.error === "signin") onOut();
        return;
      }
      setLinks((cur) => [j.link!, ...(cur ?? [])]);
      setFresh(j.link.id); setAmount(""); setLabel("");
      window.dispatchEvent(new CustomEvent("qova:made"));
    } catch { setFormErr("Could not save the link. Try again."); }
    finally { setMaking(false); }
  }

  async function remove(id: string) {
    if (sure !== id) { setSure(id); setTimeout(() => setSure((s) => (s === id ? null : s)), 3000); return; }
    setSure(null);
    const r = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (r.ok) setLinks((cur) => (cur ?? []).filter((l) => l.id !== id));
  }

  async function signOut() { try { await post("/api/auth/logout"); } finally { onOut(); } }

  const pageUrl = (l: LinkRec) => payPageUrl(origin, { to: l.to, amount: l.amount, label: l.label || undefined, message: l.message || undefined, ref: l.ref });
  const all = links ?? [];
  const paid = all.filter((l) => l.status === "paid").sort((a, b) => (b.paid?.blockTime ?? 0) - (a.paid?.blockTime ?? 0));
  const received = paid.reduce((s, l) => s + micro(l.amount), 0);
  const spark = useMemo(() => {
    const asc = [...paid].sort((a, b) => (a.paid?.blockTime ?? 0) - (b.paid?.blockTime ?? 0));
    let run = 0; const pts = [0];
    for (const l of asc) { run += micro(l.amount); pts.push(run); }
    return pts.length > 2 ? pts : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links]);
  const shown = all.filter((l) => !q || (l.label || "pay link").toLowerCase().includes(q.toLowerCase()) || l.amount.includes(q));
  const newest = all.find((l) => l.id === fresh);
  const hour = new Date().getHours();
  const greet = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const show = (s: string) => tab === "Home" || tab === s;

  const NAV: [string, React.ReactNode][] = [["Home", <House key="h" size={18} />], ["Links", <Link2 key="l" size={18} />], ["Activity", <ActivityIcon key="a" size={18} />], ["Wallets", <Wallet key="w" size={18} />], ["Settings", <Settings key="s" size={18} />]];

  return (
    <div className="ax-shell">
      <aside className="ax-side">
        <a href="/" className="ax-logo"><Mark size={22} /> QOVA</a>
        <nav className="ax-nav">{NAV.map(([n, i]) => <button key={n} className={tab === n ? "is-on" : ""} onClick={() => setTab(n)}>{i}<span>{n}</span></button>)}</nav>
        <div className="ax-user">
          <span className="ax-av">{wallet.slice(0, 1)}</span>
          <div><b>{shortAddress(wallet)}</b><span className="mono">Signed in</span></div>
          <button aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="ax-main">
        <div className="ax-banner"><Sparkles size={14} /> Early beta · payments go wallet to wallet · $QOVA is a memecoin, not a dollar</div>
        <header className="ax-top">
          <div><p className="mono ax-date">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1>{greet}</h1></div>
          <div className="ax-top-r">
            <label className="ax-search"><Search size={16} /><input placeholder="Search links" value={q} onChange={(e) => { setQ(e.target.value); if (tab !== "Home" && tab !== "Links") setTab("Links"); }} /></label>
            <ThemeToggle />
            <a href="#quick" className="ax-new" onClick={() => setTab("Home")}><Plus size={16} /> New link</a>
          </div>
        </header>

        {loadErr && <p className="ax-err">{loadErr} <button className="ax-text" onClick={load}>Retry</button></p>}

        <div className="ax-grid">
          {show("Activity") && (
            <section className="ax-card2 ax-bal">
              <div className="ax-bal-h"><span className="mono">Received through your links</span><span className="ax-pill">{paid.length} paid</span></div>
              <div className="ax-bal-v"><TokenIcon kind="usdc" size={36} /><b>{links ? fromMicro(received) : "…"}</b><small>USDC</small></div>
              <Spark points={spark} />
              <div className="ax-bal-f"><span><b>{paid.length}</b> payments</span><span><b>{all.length - paid.length}</b> open links</span><span><b>{all.length}</b> links</span></div>
            </section>
          )}

          {show("Links") && (
            <section className="ax-card2 ax-quick" id="quick">
              <div className="ax-h"><b>Quick link</b><span className="mono">to {shortAddress(wallet)}</span></div>
              <form onSubmit={create}>
                <div className="ax-q-amt"><input inputMode="decimal" placeholder="25.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" required /><span className="mono">USDC</span></div>
                <input className="ax-q-for" placeholder="What is it for" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} aria-label="What is it for" />
                <button type="submit" className="ax-q-btn" disabled={making}>{making ? <LoaderCircle size={16} className="ax-spin" /> : <Link2 size={16} />} Create link</button>
              </form>
              {formErr && <p className="ax-err" role="alert">{formErr}</p>}
              {newest && (
                <div className="ax-made" role="status">
                  <span><Check size={14} strokeWidth={3} /> Link ready · {displayAmount(newest.amount)} USDC</span>
                  <span className="ax-row-act"><CopyIcon text={pageUrl(newest)} label="Copy link" /><button aria-label="Show QR" onClick={() => setQr(newest)}><QrCode size={15} /></button></span>
                </div>
              )}
              <p className="ax-fine">Wallet to wallet. We never hold your money.</p>
            </section>
          )}

          {show("Links") && (
            <section className="ax-card2 ax-links">
              <div className="ax-h"><b>Your pay links</b>{tab === "Home" && all.length > 5 && <button className="ax-text" onClick={() => setTab("Links")}>View all <ChevronRight size={14} /></button>}</div>
              {links === null ? <p className="ax-empty">Loading…</p> : shown.length === 0 ? (
                <p className="ax-empty">{q ? "No links match." : "No links yet. Make your first one with Quick link."}</p>
              ) : (
                <div className="ax-table">
                  {(tab === "Home" ? shown.slice(0, 5) : shown).map((r) => (
                    <div key={r.id} className="ax-row">
                      <span className="ax-row-ico"><Link2 size={15} /></span>
                      <div className="ax-row-t"><b>{r.label || "Pay link"}</b><span className="mono">{when(r.createdAt)}</span></div>
                      <span className="ax-row-a">{displayAmount(r.amount)}<small> USDC</small></span>
                      <span className={`ax-status ax-s-${r.status}`}>{r.status === "paid" ? <><Check size={12} strokeWidth={3} />Paid</> : "Open"}</span>
                      <span className="ax-row-act">
                        <CopyIcon text={pageUrl(r)} label="Copy link" />
                        <button aria-label="Show QR" title="Show QR" onClick={() => setQr(r)}><QrCode size={15} /></button>
                        <a aria-label="Open pay page" title="Open pay page" href={pageUrl(r)} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>
                        <button aria-label={sure === r.id ? "Tap again to delete" : "Delete link"} title={sure === r.id ? "Tap again to delete" : "Delete"} className={sure === r.id ? "is-danger" : ""} onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {show("Activity") && (
            <section className="ax-card2 ax-act">
              <div className="ax-h"><b>Activity</b><span className="ax-live"><i /> Live</span></div>
              {paid.length === 0 ? <p className="ax-empty">Payments to your links show up here within seconds.</p> : (
                <ul>
                  {paid.slice(0, tab === "Home" ? 5 : 50).map((x) => (
                    <li key={x.id}>
                      <span className="ax-in"><ArrowDownLeft size={15} /></span>
                      <div><b>+{displayAmount(x.amount)} USDC</b><span className="mono">{x.paid?.payer ? shortAddress(x.paid.payer) : "Payer"} · {x.label || "Pay link"} · {x.paid?.blockTime ? when(x.paid.blockTime * 1000) : ""}</span></div>
                      {x.paid && <a aria-label="View on Solscan" href={`https://solscan.io/tx/${x.paid.signature}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {show("Wallets") && (
            <section className="ax-card2 ax-acc">
              <div className="ax-h"><b>Connected accounts</b></div>
              <div className="ax-acc-row"><span className="ax-m-ico"><Wallet size={16} /></span><div><b>Wallet</b><span className="mono">{shortAddress(wallet)} · receives payments</span></div><span className="ax-ok ax-primary">Primary</span></div>
              <div className="ax-acc-row is-soon"><span className="ax-m-ico ax-g">G</span><div><b>Google</b><span className="mono">Coming soon</span></div><span className="ax-soon">Soon</span></div>
              <p className="ax-fine"><ShieldCheck size={13} /> Wallets are linked by signing a free message. Never a transaction.</p>
            </section>
          )}

          {tab === "Settings" && (
            <section className="ax-card2 ax-acc">
              <div className="ax-h"><b>Settings</b></div>
              <div className="ax-acc-row"><span className="ax-m-ico"><Sparkles size={16} /></span><div><b>Theme</b><span className="mono">Light or dark</span></div><ThemeToggle /></div>
              <div className="ax-acc-row"><span className="ax-m-ico"><KeyRound size={16} /></span><div><b>Session</b><span className="mono">Stays signed in for 30 days</span></div><button className="ax-text" onClick={signOut}>Sign out</button></div>
              <p className="ax-fine">We store your public address and the links you make. No keys, no funds, ever.</p>
            </section>
          )}
        </div>
      </div>

      <nav className="ax-tabbar">{NAV.map(([n, i]) => <button key={n} className={tab === n ? "is-on" : ""} onClick={() => setTab(n)}>{i}<span>{n}</span></button>)}</nav>

      {qr && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-label="Pay link QR" onClick={() => setQr(null)}>
          <div className="ax-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="ax-modal-x" aria-label="Close" onClick={() => setQr(null)}><X size={18} /></button>
            <p className="mono">{qr.label || "Pay link"}</p>
            <h3>{displayAmount(qr.amount)} <small>USDC</small></h3>
            <QR value={solanaPayUrl({ to: qr.to, amount: qr.amount, label: qr.label || undefined, message: qr.message || undefined, ref: qr.ref })} label="Scan with a Solana wallet to pay" />
            <p className="ax-fine">Scan with any Solana wallet. Or share the link.</p>
            <div className="ax-modal-row"><CopyIcon text={pageUrl(qr)} label="Copy link" /><span>{pageUrl(qr).replace(/^https?:\/\//, "").slice(0, 38)}…</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
