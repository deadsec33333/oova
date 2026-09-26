"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, ExternalLink, KeyRound, LoaderCircle, ShieldCheck, WalletMinimal, X } from "lucide-react";
import { getAccount, loadAccount, signInError, signInWith, type Phase } from "@/lib/account";
import { systemNotify } from "@/lib/notify";
import { firstSeen, unwatch, watched } from "@/lib/watchlist";
import { watchWallets, walletBrowseLinks, type FoundWallet } from "@/lib/wallets";
import { displayAmount, shortAddress } from "@/lib/solanapay";

export type PaidDetail = { ref: string; amount: string; label?: string; message?: string; signature?: string; payer?: string | null; link?: unknown };
type Toast = PaidDetail & { key: number };

const post = (url: string, body?: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const paid = (d: PaidDetail) => window.dispatchEvent(new CustomEvent<PaidDetail>("qova:paid", { detail: d }));

/** Mounted once for the whole site: connect sheet, payment watcher, paid alerts. */
export default function AccountHost() {
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Service worker only for tap to open alerts on phones.
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
    loadAccount();
    const o = () => setOpen(true);
    window.addEventListener("qova:connect", o);
    return () => window.removeEventListener("qova:connect", o);
  }, []);

  // Alert once per payment, however it was found.
  useEffect(() => {
    let restore: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      const d = (e as CustomEvent<PaidDetail>).detail;
      if (!d?.ref || !firstSeen(d.ref)) return;
      const key = Date.now() + Math.random();
      setToasts((t) => [{ ...d, key }, ...t].slice(0, 3));
      setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 16000);
      const amt = displayAmount(d.amount);
      window.dispatchEvent(new Event("qova:made"));
      if (document.visibilityState !== "visible" || !document.hasFocus()) systemNotify(`Paid · ${amt} USDC`, `${d.message || d.label || "Your pay link"} was paid. It is in your wallet.`);
      const was = document.title.startsWith("Paid ·") ? document.title.split(" | ")[1] ?? document.title : document.title;
      document.title = `Paid · ${amt} USDC | ${was}`;
      clearTimeout(restore);
      restore = setTimeout(() => { document.title = was; }, 12000);
    };
    window.addEventListener("qova:paid", on);
    return () => { window.removeEventListener("qova:paid", on); clearTimeout(restore); };
  }, []);

  // Watch saved links (signed in) and links kept on this device.
  useEffect(() => {
    let busy = false;
    const run = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const w = getAccount().wallet;
        if (w) {
          // Links made here before signing in move into the account.
          let moved = false;
          for (const l of watched().filter((x) => x.to === w)) {
            const r = await post("/api/links", { amount: l.amount, label: l.label, message: l.message, ref: l.ref, createdAt: l.createdAt });
            if (r.ok || r.status === 409) { unwatch(l.ref); moved = true; }
          }
          if (moved) window.dispatchEvent(new Event("qova:links"));
          const r = await fetch("/api/links", { cache: "no-store" });
          if (r.ok) {
            const { links } = (await r.json()) as { links: { id: string; status: string; createdAt: number; ref: string; amount: string; label: string; message: string }[] };
            const open = links.filter((l) => l.status === "open" && Date.now() - l.createdAt < 30 * 86400_000).slice(0, 8);
            for (const l of open) {
              const c = await post(`/api/links/${l.id}/check`);
              const j = (await c.json().catch(() => ({}))) as { link?: { status: string; paid?: { signature: string; payer: string | null } } };
              if (j.link?.status === "paid") paid({ ref: l.ref, amount: l.amount, label: l.label, message: l.message, signature: j.link.paid?.signature, payer: j.link.paid?.payer, link: j.link });
            }
          }
        }
        for (const l of watched()) {
          if (w && l.to === w) continue;
          const q = new URLSearchParams({ to: l.to, amount: l.amount, ref: l.ref });
          const r = await fetch(`/api/pay/status?${q}`, { cache: "no-store" });
          const j = (await r.json().catch(() => ({}))) as { status?: string; signature?: string; payer?: string | null };
          if (j.status === "paid") { unwatch(l.ref); paid({ ref: l.ref, amount: l.amount, label: l.label, message: l.message, signature: j.signature, payer: j.payer }); }
          if (j.status === "invalid") unwatch(l.ref);
        }
      } catch { /* next round */ } finally { busy = false; }
    };
    const t = setTimeout(run, 1500);
    const iv = setInterval(run, 15000);
    const vis = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("focus", vis);
    window.addEventListener("pageshow", vis);
    window.addEventListener("qova:account", run);
    window.addEventListener("qova:watch", run);
    return () => {
      clearTimeout(t); clearInterval(iv);
      document.removeEventListener("visibilitychange", vis); window.removeEventListener("focus", vis); window.removeEventListener("pageshow", vis);
      window.removeEventListener("qova:account", run); window.removeEventListener("qova:watch", run);
    };
  }, []);

  return (
    <>
      {open && <ConnectSheet onClose={() => setOpen(false)} />}
      <div className="qt-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.key} className="qt" role="status">
            <span className="qt-ico"><Check size={18} strokeWidth={3} /></span>
            <div className="qt-t">
              <b>Paid · {displayAmount(t.amount)} USDC received</b>
              <span>{t.message || t.label || "Pay link"}{t.payer ? ` · from ${shortAddress(t.payer)}` : ""}</span>
            </div>
            {t.signature && <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noopener" className="qt-a">Receipt <ExternalLink size={12} /></a>}
            <button className="qt-x" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.key !== t.key))}><X size={14} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

const PH: Record<Phase, string> = { idle: "", connect: "Connecting to your wallet", sign: "Check your wallet and sign the message", verify: "Checking the signature" };

export function ConnectSheet({ onClose }: { onClose: () => void }) {
  const [wallets, setWallets] = useState<FoundWallet[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [here, setHere] = useState("");
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHere(window.location.href);
    const stop = watchWallets(setWallets);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    card.current?.focus();
    return () => { stop(); window.removeEventListener("keydown", esc); };
  }, [onClose]);

  async function go(w: FoundWallet) {
    setErr(""); setBusy(w.name);
    try {
      const a = await signInWith(w, (p, m) => { setPhase(p); if (m) setMsg(m); });
      setDone(a);
      setTimeout(onClose, 1400);
    } catch (e) { setErr(signInError(e)); setPhase("idle"); }
    finally { setBusy(null); }
  }

  return (
    <div className="ax-modal cs" role="dialog" aria-modal="true" aria-label="Connect a wallet" onClick={onClose}>
      <div className="ax-modal-card cs-card" ref={card} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <button className="ax-modal-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        {done ? (
          <div className="cs-done">
            <span className="cs-check"><Check size={26} strokeWidth={3} /></span>
            <h3>Connected</h3>
            <p className="mono">{shortAddress(done)}</p>
            <p className="ax-fine">Your links now save to your account and we watch them for you.</p>
          </div>
        ) : (
          <>
            <p className="mono cs-k">Connect</p>
            <h3 className="cs-h">Your wallet</h3>
            <p className="ax-fine cs-sub">Links you make get saved and watched. You get an alert the second someone pays.</p>
            {wallets === null ? <p className="ax-fine">Looking for wallets…</p> : wallets.length ? (
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
                <p><b>No wallet in this browser.</b> On a phone, open QOVA inside your wallet app:</p>
                <div className="ax-wallets">
                  {here && walletBrowseLinks(here).map((l) => <a key={l.name} className="ax-w" href={l.href}><span className="ax-w-ico"><WalletMinimal size={16} /></span>Open in {l.name}<ExternalLink size={15} /></a>)}
                </div>
                <p className="ax-fine">On a computer, add <a href="https://phantom.com" target="_blank" rel="noreferrer">Phantom</a> or <a href="https://solflare.com" target="_blank" rel="noreferrer">Solflare</a>, then reload.</p>
              </div>
            )}
            {phase !== "idle" && <p className="ax-phase" role="status"><LoaderCircle size={14} className="ax-spin" /> {PH[phase]}</p>}
            {err && <p className="ax-err" role="alert">{err}</p>}
            <div className="ax-msg cs-msg">
              <div className="ax-msg-h"><KeyRound size={14} /><span className="mono">{msg ? "Message you are signing" : "You only sign a message"}</span></div>
              {msg ? <pre>{msg}</pre> : <p className="cs-msg-p">A free text message with a one time code. It is not a transaction and it cannot move funds.</p>}
              <p className="ax-safe"><ShieldCheck size={14} /> QOVA will never ask you to sign a transaction to log in.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
