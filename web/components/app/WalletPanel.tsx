"use client";
import { useState } from "react";
import { ExternalLink, KeyRound, LogOut, Mail, Moon, QrCode, RefreshCw, ShieldCheck, Volume2, Wallet } from "lucide-react";
import TokenIcon from "@/components/TokenIcon";
import ThemeToggle from "@/components/ThemeToggle";
import AlertButton from "@/components/AlertButton";
import QR from "@/components/QR";
import { USDC_MINT } from "@/lib/solanapay";
import type { Bal } from "./BalanceCard";
import SoundSwitch from "./SoundSwitch";
import { CopyIcon, Sheet, Skel, fromMicro, micro } from "./shared";

export default function WalletPanel({ wallet, bal, onRefresh, onSignOut, received }: { wallet: string; bal: Bal; onRefresh: () => void; onSignOut: () => void; received: string | null }) {
  const [qr, setQr] = useState(false);
  return (
    <div className="ax-stack">
      <section className="ax-tile ax-hero ax-wal" aria-label="Your wallet">
        <div className="ax-hero-top"><span className="mono">In your wallet</span><button className="ax-ibtn ax-ibtn-dark" onClick={onRefresh} aria-label="Refresh balance" title="Refresh"><RefreshCw size={14} /></button></div>
        <div className="ax-hero-v">
          <TokenIcon kind="usdc" size={34} />
          {bal.state === "loading" ? <Skel w={170} h={52} r={12} className="is-dark" />
            : bal.state === "ok" && bal.usdc !== undefined ? <b>{fromMicro(micro(bal.usdc))}</b>
            : <b className="ax-quiet" title="Balance not available right now" aria-label="Balance not available right now">–</b>}
          <small>USDC</small>
        </div>
        <p className="ax-hero-sub">Your USDC on Solana right now, read straight from the chain. {received !== null && <>Received through QOVA so far: {received} USDC.</>}</p>
        <div className="ax-addr">
          <span className="mono">Address</span>
          <code>{wallet}</code>
          <div className="ax-addr-a">
            <CopyIcon text={wallet} label="Copy address" className="ax-ibtn ax-ibtn-dark" />
            <button className="ax-ibtn ax-ibtn-dark" onClick={() => setQr(true)} aria-label="Show receive QR" title="Receive QR"><QrCode size={15} /></button>
            <a className="ax-ibtn ax-ibtn-dark" href={`https://solscan.io/account/${wallet}`} target="_blank" rel="noreferrer" aria-label="View on Solscan" title="Solscan"><ExternalLink size={15} /></a>
          </div>
        </div>
      </section>

      <section className="ax-tile" aria-label="Sign in methods">
        <div className="ax-h"><h2>Sign in</h2></div>
        <div className="ax-set"><span className="ax-set-ico"><Wallet size={16} /></span><div><b>Solana wallet</b><span>Receives every payment · signs in with a free message</span></div><span className="ax-pill ax-pill-ink">Primary</span></div>
        <div className="ax-set is-soon"><span className="ax-set-ico ax-g">G</span><div><b>Google</b><span>Not live yet</span></div><span className="ax-soon">Soon</span></div>
        <div className="ax-set is-soon"><span className="ax-set-ico"><Mail size={16} /></span><div><b>Email</b><span>Not live yet</span></div><span className="ax-soon">Soon</span></div>
        <p className="ax-fine"><ShieldCheck size={13} /> QOVA will never ask you to sign a transaction to log in.</p>
      </section>

      <section className="ax-tile" aria-label="Settings">
        <div className="ax-h"><h2>Settings</h2></div>
        <div className="ax-set"><span className="ax-set-ico"><Moon size={16} /></span><div><b>Theme</b><span>White or black edition</span></div><ThemeToggle /></div>
        <div className="ax-set"><span className="ax-set-ico"><Volume2 size={16} /></span><div><b>Sound</b><span>A cash ping when a counter payment lands</span></div><SoundSwitch /></div>
        <div className="ax-set"><span className="ax-set-ico"><ShieldCheck size={16} /></span><div><b>Alerts</b><span>A notification when a link is paid, while a QOVA tab is open</span></div><AlertButton compact className="ax-icon" /></div>
        <div className="ax-set"><span className="ax-set-ico"><KeyRound size={16} /></span><div><b>Session</b><span>Stays signed in on this device for 30 days</span></div><button className="ax-btn ax-btn-sm" onClick={onSignOut}><LogOut size={14} /> Sign out</button></div>
        <p className="ax-fine">We store your public address and the links you make. No keys, no funds, ever.</p>
      </section>

      {qr && (
        <Sheet label="Receive USDC" onClose={() => setQr(false)}>
          <div className="ax-det ax-center">
            <p className="mono ax-det-top-c">Receive USDC</p>
            <div className="ax-recv-qr"><QR value={`solana:${wallet}?spl-token=${USDC_MINT}`} label="Scan to send USDC to this wallet" /></div>
            <p className="ax-fine ax-center">Scan with a Solana wallet to send USDC here. For a set amount with a live Paid alert, make a pay link instead.</p>
            <div className="ax-addr ax-addr-light"><code>{wallet}</code><CopyIcon text={wallet} label="Copy address" className="ax-ibtn" /></div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
