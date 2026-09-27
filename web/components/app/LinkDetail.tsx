"use client";
import { useState } from "react";
import { Check, CircleDot, ExternalLink, Link2, LoaderCircle, Maximize2, Share2, Trash2 } from "lucide-react";
import { displayAmount, shortAddress } from "@/lib/solanapay";
import { StatusPill } from "./LinksList";
import { CopyIcon, Sheet, fullDate, linkName, paidAt, shareLink, when, type LinkRec } from "./shared";

function Field({ k, v, copy, href }: { k: string; v: string; copy?: string; href?: string }) {
  return (
    <div className="ax-field2">
      <span>{k}</span>
      <b className="mono" title={copy ?? v}>{v}</b>
      <span className="ax-field2-a">
        {copy && <CopyIcon text={copy} label={`Copy ${k.toLowerCase()}`} className="ax-ibtn ax-ibtn-sm" />}
        {href && <a className="ax-ibtn ax-ibtn-sm" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${k.toLowerCase()} on Solscan`}><ExternalLink size={13} /></a>}
      </span>
    </div>
  );
}

export default function LinkDetail({ l, pageUrl, onClose, onCounter, onDelete }: {
  l: LinkRec; pageUrl: (l: LinkRec) => string; onClose: () => void; onCounter: (l: LinkRec) => void; onDelete: (id: string) => Promise<boolean>;
}) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const url = pageUrl(l);
  const paid = l.status === "paid" && l.paid;

  const del = async () => {
    if (!sure) { setSure(true); setTimeout(() => setSure(false), 3500); return; }
    setBusy(true);
    const ok = await onDelete(l.id);
    setBusy(false);
    if (ok) onClose(); else setNote("Could not delete. Try again.");
  };

  return (
    <Sheet label={`Pay link: ${linkName(l)}`} onClose={onClose}>
      <div className="ax-det">
        <div className="ax-det-top"><StatusPill l={l} /><span className="mono">Made {when(l.createdAt)}</span></div>
        <h2 className="ax-det-name">{linkName(l)}</h2>
        <p className="ax-det-amt">{displayAmount(l.amount)}<small>USDC</small></p>
        <p className="ax-det-to mono">to {shortAddress(l.to)}</p>

        <div className="ax-det-actions">
          <CopyIcon text={url} label="Copy link" className="ax-act" />
          <button type="button" className="ax-act" aria-label="Share link" onClick={async () => { const r = await shareLink(url, "Pay link", `Pay ${displayAmount(l.amount)} USDC · ${linkName(l)}`); setNote(r === "copied" ? "Link copied. Paste it anywhere." : ""); }}><Share2 size={15} /></button>
          {l.status === "open" && <button type="button" className="ax-act" aria-label="Counter mode QR" onClick={() => onCounter(l)}><Maximize2 size={15} /></button>}
          <a className="ax-act" href={url} target="_blank" rel="noreferrer" aria-label="Open pay page"><ExternalLink size={15} /></a>
        </div>
        <div className="ax-det-labels" aria-hidden="true"><span>Copy</span><span>Share</span>{l.status === "open" && <span>Counter</span>}<span>Open</span></div>
        {note && <p className="ax-fine" role="status">{note}</p>}

        <h3 className="ax-det-h">Timeline</h3>
        <ol className="ax-tl">
          <li className="is-done"><span className="ax-tl-dot"><Link2 size={12} /></span><div><b>Link made</b><span>{fullDate(l.createdAt)}</span></div></li>
          {paid ? (
            <li className="is-done is-paid"><span className="ax-tl-dot"><Check size={12} strokeWidth={3} /></span><div><b>Paid · {displayAmount(l.amount)} USDC</b><span>{fullDate(paidAt(l))}{l.paid?.payer ? ` · from ${shortAddress(l.paid.payer)}` : ""}</span></div></li>
          ) : (
            <li className="is-now"><span className="ax-tl-dot"><CircleDot size={12} /></span><div><b>Waiting for payment</b><span>Checked on Solana every 15 s while QOVA is open</span></div></li>
          )}
        </ol>

        {paid ? (
          <>
            <h3 className="ax-det-h">Receipt</h3>
            <div className="ax-receipt">
              <div className="ax-receipt-top"><span className="mono">Received</span><b>{displayAmount(l.amount)} USDC</b></div>
              <Field k="From" v={l.paid!.payer ? shortAddress(l.paid!.payer) : "Unknown"} copy={l.paid!.payer ?? undefined} href={l.paid!.payer ? `https://solscan.io/account/${l.paid!.payer}` : undefined} />
              <Field k="To" v={shortAddress(l.to)} copy={l.to} />
              <Field k="Date" v={fullDate(paidAt(l))} />
              <Field k="Amount" v={l.paid!.exact ? "Exact amount" : "At least the amount asked"} />
              <Field k="Network" v="Solana · USDC" />
              <Field k="Transaction" v={shortAddress(l.paid!.signature)} copy={l.paid!.signature} href={`https://solscan.io/tx/${l.paid!.signature}`} />
              <Field k="Reference" v={shortAddress(l.ref)} copy={l.ref} />
            </div>
            <p className="ax-fine">Paid wallet to wallet. QOVA never held this money.</p>
          </>
        ) : (
          <div className="ax-receipt ax-receipt-open">
            <Field k="Reference" v={shortAddress(l.ref)} copy={l.ref} />
            <p className="ax-fine">A random key in the link, so the payment can be found on Solana. It cannot move funds.</p>
          </div>
        )}

        <button type="button" className={`ax-del${sure ? " is-sure" : ""}`} onClick={del} disabled={busy}>
          {busy ? <LoaderCircle size={15} className="ax-spin" /> : <Trash2 size={15} />}
          {sure ? "Tap again to delete" : "Delete link"}
        </button>
        {l.status === "open" && <p className="ax-fine ax-center">Deleting removes it from your list. Anyone who already has the link could still pay it.</p>}
      </div>
    </Sheet>
  );
}
