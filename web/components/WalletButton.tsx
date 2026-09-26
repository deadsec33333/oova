"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, LayoutDashboard, LogOut, Wallet } from "lucide-react";
import { openConnect, signOut, useAccount } from "@/lib/account";
import { shortAddress } from "@/lib/solanapay";

/** Connect button in the nav. Signed in: address chip with a small menu. */
export default function WalletButton() {
  const a = useAccount();
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const out = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("pointerdown", out); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", out); window.removeEventListener("keydown", esc); };
  }, [menu]);

  if (!a.loaded || !a.ready) return null;

  if (!a.wallet) {
    return (
      <button type="button" className="wbtn" onClick={openConnect} aria-label="Connect a wallet">
        <Wallet size={17} strokeWidth={1.9} /><span>Connect</span>
      </button>
    );
  }

  return (
    <div className="wbox" ref={box}>
      <button type="button" className="wbtn is-on" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" aria-label={`Wallet ${shortAddress(a.wallet)}`}>
        <i className="wdot" aria-hidden="true" /><span className="mono">{shortAddress(a.wallet)}</span>
      </button>
      {menu && (
        <div className="wmenu" role="menu">
          <div className="wmenu-h"><span className="mono">Signed in</span><b className="mono">{shortAddress(a.wallet)}</b></div>
          <a role="menuitem" href="/app"><LayoutDashboard size={15} /> Dashboard</a>
          <button role="menuitem" onClick={async () => { try { await navigator.clipboard.writeText(a.wallet!); setCopied(true); setTimeout(() => setCopied(false), 1300); } catch { /* ignore */ } }}><Copy size={15} /> {copied ? "Copied" : "Copy address"}</button>
          <button role="menuitem" onClick={async () => { setMenu(false); await signOut(); }}><LogOut size={15} /> Sign out</button>
        </div>
      )}
    </div>
  );
}
