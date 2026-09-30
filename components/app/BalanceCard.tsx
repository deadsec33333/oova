"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import TokenIcon from "@/components/TokenIcon";
import { DAY, Skel, fromMicro, micro, paidAt, startOfDay, useCountUp, type LinkRec } from "./shared";

export type Period = "7d" | "30d" | "all";
export type Bal = { state: "loading" | "ok" | "err"; usdc?: string };
const PERIODS: [Period, string][] = [["7d", "7D"], ["30d", "30D"], ["all", "All"]];
const SPAN: Record<Period, string> = { "7d": "last 7 days", "30d": "last 30 days", all: "all time" };

type Bucket = { start: number; end: number; sum: number; cum: number; n: number };

/** Day buckets over the period, by the time the payment landed on Solana. */
function buckets(paid: LinkRec[], period: Period): Bucket[] {
  const today = startOfDay(Date.now());
  let first: number, size = DAY;
  if (period === "all") {
    const oldest = paid.length ? Math.min(...paid.map((l) => startOfDay(paidAt(l)))) : today;
    const days = Math.max(7, Math.round((today - oldest) / DAY) + 1);
    size = Math.ceil(days / 60) * DAY;
    first = today - (Math.ceil(days / (size / DAY)) - 1) * size;
  } else {
    first = today - ((period === "7d" ? 7 : 30) - 1) * DAY;
  }
  const out: Bucket[] = [];
  for (let s = first; s <= today; s += size) out.push({ start: s, end: s + size, sum: 0, cum: 0, n: 0 });
  for (const l of paid) {
    const t = paidAt(l);
    const b = out.find((x) => t >= x.start && t < x.end) ?? (t >= today ? out[out.length - 1] : undefined);
    if (b) { b.sum += micro(l.amount); b.n++; }
  }
  let run = 0;
  for (const b of out) { run += b.sum; b.cum = run; }
  return out;
}

const dLabel = (b: Bucket) => {
  const f = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return b.end - b.start > DAY ? `${f(b.start)} to ${f(b.end - DAY)}` : f(b.start);
};

function Chart({ data, reduce }: { data: Bucket[]; reduce: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const h = 120, pad = 6;
  const max = Math.max(1, ...data.map((b) => b.cum));
  // a zero point before the first bucket, so even one payment draws a rise
  const pts = [0, ...data.map((b) => b.cum)].map((v, i, a) => [(i / (a.length - 1)) * w, h - pad - (v / max) * (h - pad * 2 - 8)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const pick = (x: number) => {
    if (!w) return;
    const i = Math.round((x / w) * data.length) - 1;
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const hb = hover !== null ? data[hover] : null;
  const hp = hover !== null ? pts[hover + 1] : null;
  return (
    <div className="ax-chart" ref={box}
      onPointerMove={(e) => pick(e.clientX - e.currentTarget.getBoundingClientRect().left)}
      onPointerDown={(e) => pick(e.clientX - e.currentTarget.getBoundingClientRect().left)}
      onPointerLeave={() => setHover(null)}>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <defs>
            <linearGradient id="axcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".2" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient>
          </defs>
          {[0.33, 0.66].map((g) => <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} className="ax-chart-grid" />)}
          <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="url(#axcg)" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={reduce ? "" : "ax-chart-line"} pathLength={1} />
          {data.map((b, i) => b.n > 0 && <circle key={b.start} cx={pts[i + 1][0]} cy={pts[i + 1][1]} r="3" className="ax-chart-dot" />)}
          {hp && <><line x1={hp[0]} x2={hp[0]} y1="0" y2={h} className="ax-chart-rule" /><circle cx={hp[0]} cy={hp[1]} r="5" className="ax-chart-hit" /></>}
        </svg>
      )}
      {hb && hp && (
        <div className="ax-tip" style={{ left: Math.min(Math.max(hp[0], 70), w - 70) }} role="status">
          <span className="mono">{dLabel(hb)}</span>
          <b>{hb.n ? `+${fromMicro(hb.sum)} USDC` : "Nothing received"}</b>
          <span>{fromMicro(hb.cum)} total</span>
        </div>
      )}
    </div>
  );
}

export default function BalanceCard({ links, bal, openCount, total, reduce }: { links: LinkRec[] | null; bal: Bal; openCount: number; total: number; reduce: boolean }) {
  const [period, setPeriod] = useState<Period>("30d");
  const paid = useMemo(() => (links ?? []).filter((l) => l.status === "paid"), [links]);
  const data = useMemo(() => buckets(paid, period), [paid, period]);
  const start = data[0]?.start ?? 0;
  const inPeriod = period === "all" ? paid : paid.filter((l) => paidAt(l) >= start);
  const sum = inPeriod.reduce((s, l) => s + micro(l.amount), 0);
  const shown = useCountUp(links ? sum : 0);
  const loading = links === null;

  return (
    <section className="ax-tile ax-hero" aria-label="Money received">
      <div className="ax-hero-top">
        <span className="mono">Received through QOVA</span>
        <div className="ax-seg" role="tablist" aria-label="Period">
          {PERIODS.map(([p, t]) => <button key={p} role="tab" aria-selected={period === p} className={period === p ? "is-on" : ""} onClick={() => setPeriod(p)}>{t}</button>)}
        </div>
      </div>
      <div className="ax-hero-v">
        <TokenIcon kind="usdc" size={34} />
        {loading ? <Skel w={180} h={52} r={12} className="is-dark" /> : <b aria-live="polite">{fromMicro(Math.round(shown))}</b>}
        <small>USDC</small>
      </div>
      <p className="ax-hero-sub">{loading ? " " : `${inPeriod.length} ${inPeriod.length === 1 ? "payment" : "payments"} · ${SPAN[period]}`}</p>
      {loading ? <div className="ax-chart ax-chart-skel"><Skel h={110} r={14} className="is-dark" /></div>
        : inPeriod.length ? <Chart data={data} reduce={reduce} />
        : (
          <div className="ax-chart ax-chart-empty">
            <span>{paid.length ? `Nothing received in the ${SPAN[period]}.` : "Your first payment draws this line."}</span>
            {paid.length > 0 && period !== "all" && <button className="ax-linkbtn" onClick={() => setPeriod("all")}>See all time</button>}
          </div>
        )}
      <div className="ax-hero-f">
        <div>
          <span className="mono">In your wallet</span>
          {bal.state === "loading" ? <Skel w={90} h={18} className="is-dark" />
            : bal.state === "ok" && bal.usdc !== undefined ? <b>{fromMicro(micro(bal.usdc))} <small>USDC</small></b>
            : <b className="ax-quiet" title="Balance not available right now" aria-label="Balance not available right now">–</b>}
          <small className="ax-hero-note">Live on Solana</small>
        </div>
        <div><span className="mono">Open links</span><b>{loading ? "…" : openCount}</b><small className="ax-hero-note">Waiting to be paid</small></div>
        <div className="ax-hide-sm"><span className="mono">Links made</span><b>{loading ? "…" : total}</b><small className="ax-hero-note">All time</small></div>
      </div>
    </section>
  );
}
