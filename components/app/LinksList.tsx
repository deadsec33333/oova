"use client";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Check, ChevronRight, Link2, Maximize2, Plus, Search } from "lucide-react";
import { Mark } from "@/components/Logo";
import { shortAddress } from "@/lib/solanapay";
import { Amount, CopyIcon, Skel, byCard, cardInFlight, linkName, micro, paidAt, when, type LinkRec } from "./shared";

type F = "all" | "open" | "paid";

export function StatusPill({ l }: { l: LinkRec }) {
  return l.status === "paid"
    ? <span className="ax-pill ax-pill-paid"><Check size={11} strokeWidth={3} />Paid</span>
    : <span className="ax-pill ax-pill-open"><i />Open</span>;
}

export function LinkRow({ l, onOpen, onCounter, pageUrl }: { l: LinkRec; onOpen: (l: LinkRec) => void; onCounter: (l: LinkRec) => void; pageUrl: (l: LinkRec) => string }) {
  const meta = l.status === "paid"
    ? byCard(l) ? `Paid by card ${when(paidAt(l))}` : `Paid ${when(paidAt(l))}${l.paid?.payer ? ` · from ${shortAddress(l.paid.payer)}` : ""}`
    : cardInFlight(l) ? "Card payment in progress" : `Made ${when(l.createdAt)}`;
  return (
    <li className={`ax-row is-${l.status}`}>
      <button type="button" className="ax-row-main" onClick={() => onOpen(l)} aria-label={`${linkName(l)}, ${l.amount} USDC, ${l.status}. Open details`}>
        <span className="ax-row-ico">{l.status === "paid" ? <Check size={16} strokeWidth={2.5} /> : <Link2 size={16} />}</span>
        <span className="ax-row-t"><b>{linkName(l)}</b><span>{meta}</span></span>
        <span className="ax-row-r"><Amount a={l.amount} /><StatusPill l={l} /></span>
        <ChevronRight size={16} className="ax-row-chev" aria-hidden="true" />
      </button>
      <span className="ax-row-tray">
        <CopyIcon text={pageUrl(l)} label="Copy link" className="ax-ibtn" />
        {l.status === "open" && <button type="button" className="ax-ibtn" aria-label="Counter mode QR" title="Counter mode" onClick={() => onCounter(l)}><Maximize2 size={15} /></button>}
      </span>
    </li>
  );
}

export function RowsSkeleton({ n = 4 }: { n?: number }) {
  return (
    <ul className="ax-rows" aria-busy="true" aria-label="Loading links">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="ax-row ax-row-skel"><span className="ax-row-main"><Skel w={40} h={40} r={13} /><span className="ax-row-t"><Skel w="60%" h={14} /><Skel w="35%" h={11} /></span><span className="ax-row-r"><Skel w={80} h={16} /><Skel w={50} h={18} r={99} /></span></span></li>
      ))}
    </ul>
  );
}

export default function LinksList({ links, compact, onOpen, onCounter, onNew, onAll, pageUrl }: {
  links: LinkRec[] | null; compact?: boolean; onOpen: (l: LinkRec) => void; onCounter: (l: LinkRec) => void; onNew: () => void; onAll?: () => void; pageUrl: (l: LinkRec) => string;
}) {
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "amount">("new");
  const all = links ?? [];
  const counts = { all: all.length, open: all.filter((l) => l.status === "open").length, paid: all.filter((l) => l.status === "paid").length };
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = all.filter((l) => (f === "all" || l.status === f) && (!t || linkName(l).toLowerCase().includes(t) || l.amount.includes(t)));
    return sort === "amount" ? [...r].sort((a, b) => micro(b.amount) - micro(a.amount)) : [...r].sort((a, b) => b.createdAt - a.createdAt);
  }, [all, f, q, sort]);
  const shown = compact ? rows.slice(0, 5) : rows;

  return (
    <section className="ax-tile ax-links" aria-label="Pay links">
      <div className="ax-h">
        <h2>{compact ? "Recent links" : "Pay links"}</h2>
        {compact ? (all.length > 5 && onAll && <button className="ax-linkbtn" onClick={onAll}>View all {all.length} <ChevronRight size={14} /></button>)
          : <button className="ax-btn ax-btn-sm" onClick={onNew}><Plus size={15} /> New link</button>}
      </div>
      {!compact && (
        <div className="ax-tools">
          <div className="ax-chips" role="tablist" aria-label="Filter links">
            {(["all", "open", "paid"] as F[]).map((k) => (
              <button key={k} role="tab" aria-selected={f === k} className={f === k ? "is-on" : ""} onClick={() => setF(k)}>
                {k === "all" ? "All" : k === "open" ? "Open" : "Paid"}<span>{links ? counts[k] : ""}</span>
              </button>
            ))}
          </div>
          <div className="ax-tools-r">
            <label className="ax-find"><Search size={15} /><span className="ax-sr">Search links</span><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <button className="ax-ibtn ax-sort" onClick={() => setSort((s) => (s === "new" ? "amount" : "new"))} aria-label={sort === "new" ? "Sorted by newest. Sort by amount" : "Sorted by amount. Sort by newest"} title={sort === "new" ? "Newest first" : "Largest first"}>
              <ArrowDownWideNarrow size={15} /><span>{sort === "new" ? "Newest" : "Amount"}</span>
            </button>
          </div>
        </div>
      )}
      {links === null ? <RowsSkeleton n={compact ? 3 : 5} />
        : all.length === 0 ? (
          <div className="ax-empty">
            <span className="ax-empty-ico"><Mark size={22} /></span>
            <b>No links yet</b>
            <p>Make a link, send it anywhere, get paid in USDC straight to your wallet.</p>
            <button className="ax-btn ax-btn-main" onClick={onNew}><Plus size={15} /> Make your first link</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="ax-empty ax-empty-sm"><b>{q ? "No links match your search." : f === "paid" ? "No paid links yet." : "No open links."}</b>{(q || f !== "all") && <button className="ax-linkbtn" onClick={() => { setQ(""); setF("all"); }}>Show all links</button>}</div>
        ) : (
          <ul className="ax-rows">{shown.map((l) => <LinkRow key={l.id} l={l} onOpen={onOpen} onCounter={onCounter} pageUrl={pageUrl} />)}</ul>
        )}
    </section>
  );
}
