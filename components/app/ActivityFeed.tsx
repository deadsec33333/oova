"use client";
import { useMemo } from "react";
import { ArrowDownLeft, ChevronRight, ExternalLink, Link2 } from "lucide-react";
import { displayAmount, shortAddress } from "@/lib/solanapay";
import { Skel, byCard, dayLabel, linkName, paidAt, txUrl, type LinkRec } from "./shared";

type Ev = { kind: "made" | "paid"; t: number; l: LinkRec };
const time = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function ActivityFeed({ links, compact, onOpen, onAll }: { links: LinkRec[] | null; compact?: boolean; onOpen: (l: LinkRec) => void; onAll?: () => void }) {
  const events = useMemo(() => {
    const ev: Ev[] = [];
    for (const l of links ?? []) {
      ev.push({ kind: "made", t: l.createdAt, l });
      if (l.status === "paid") ev.push({ kind: "paid", t: paidAt(l), l });
    }
    return ev.sort((a, b) => b.t - a.t || (a.kind === "paid" ? -1 : 1));
  }, [links]);
  const shown = compact ? events.slice(0, 6) : events;
  const groups: [string, Ev[]][] = [];
  for (const e of shown) {
    const k = dayLabel(e.t);
    const g = groups[groups.length - 1];
    if (g && g[0] === k) g[1].push(e); else groups.push([k, [e]]);
  }
  const open = (links ?? []).filter((l) => l.status === "open").length;

  return (
    <section className="ax-tile ax-feed" aria-label="Activity">
      <div className="ax-h">
        <h2>Activity</h2>
        <span className="ax-live" title="Open links are checked on Solana every 15 seconds while QOVA is open"><i />{links === null ? "Live" : open ? `Watching ${open} open ${open === 1 ? "link" : "links"}` : "Live"}</span>
      </div>
      {links === null ? (
        <div className="ax-feed-skel" aria-busy="true">{[0, 1, 2].map((i) => <div key={i}><Skel w={36} h={36} r={99} /><span><Skel w="55%" h={13} /><Skel w="35%" h={10} /></span></div>)}</div>
      ) : events.length === 0 ? (
        <div className="ax-empty ax-empty-sm"><b>Nothing here yet</b><p>Payments to your links show up here within seconds of landing on Solana.</p></div>
      ) : (
        <>
          {groups.map(([day, evs]) => (
            <div key={day} className="ax-day">
              <p className="mono ax-day-h">{day}</p>
              <ul>
                {evs.map((e) => (
                  <li key={`${e.kind}${e.l.id}`} className={`ax-ev is-${e.kind}`}>
                    <button type="button" onClick={() => onOpen(e.l)} className="ax-ev-main">
                      <span className="ax-ev-ico">{e.kind === "paid" ? <ArrowDownLeft size={16} /> : <Link2 size={15} />}</span>
                      <span className="ax-ev-t">
                        <b>{e.kind === "paid" ? `+${displayAmount(e.l.amount)} USDC` : `Link made · ${displayAmount(e.l.amount)} USDC`}</b>
                        <span>{e.kind === "paid" ? `${byCard(e.l) ? "By card · " : e.l.paid?.payer ? `From ${shortAddress(e.l.paid.payer)} · ` : ""}${linkName(e.l)}` : linkName(e.l)}</span>
                      </span>
                      <span className="ax-ev-time mono">{time(e.t)}</span>
                    </button>
                    {e.kind === "paid" && e.l.paid && <a className="ax-ibtn" href={txUrl(e.l.paid.signature, e.l.paid.network)} target="_blank" rel="noreferrer" aria-label="View on Solscan" title="View on Solscan"><ExternalLink size={14} /></a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {compact && events.length > shown.length && onAll && <button className="ax-linkbtn ax-more" onClick={onAll}>All activity <ChevronRight size={14} /></button>}
        </>
      )}
    </section>
  );
}
