"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MARK_D } from "./Logo";

const LAYERS = 14;
const RIM = "QOVA · DOLLARS FOR EVERYONE · ONE LINK AWAY · WALLET TO WALLET · ";

/** One minted face: engraved rim text, dotted ring, guilloché rosette and the raised mark. */
function Face({ id }: { id: string }) {
  const petals = Array.from({ length: 18 });
  const dots = Array.from({ length: 72 });
  return (
    <svg className="c-art" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id={`${id}-rim`} d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        <linearGradient id={`${id}-mk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f7f7" /><stop offset=".45" stopColor="#b9b9b9" /><stop offset="1" stopColor="#7c7c7c" />
        </linearGradient>
        <radialGradient id={`${id}-bg`} cx="35%" cy="25%" r="80%">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#e3e3e3" /><stop offset="1" stopColor="#a9a9a9" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#${id}-bg)`} />
      {/* rim text, engraved: dark copy + light copy offset */}
      <text className="c-rimtxt c-rimtxt-d"><textPath href={`#${id}-rim`} startOffset="0">{RIM + RIM}</textPath></text>
      <text className="c-rimtxt c-rimtxt-l" transform="translate(0 .7)"><textPath href={`#${id}-rim`} startOffset="0">{RIM + RIM}</textPath></text>
      <circle cx="100" cy="100" r="72" fill="none" stroke="#8d8d8d" strokeOpacity=".55" strokeWidth=".6" />
      <circle cx="100" cy="100" r="72.8" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth=".5" />
      {dots.map((_, i) => { const a = (i / dots.length) * Math.PI * 2; return <circle key={i} cx={100 + Math.cos(a) * 68} cy={100 + Math.sin(a) * 68} r=".85" fill="#9a9a9a" />; })}
      <g className="c-rose">
        {petals.map((_, i) => <ellipse key={i} cx="100" cy="100" rx="58" ry="20" fill="none" stroke="#8a8a8a" strokeOpacity=".28" strokeWidth=".45" transform={`rotate(${i * 10} 100 100)`} />)}
        <circle cx="100" cy="100" r="40" fill="none" stroke="#8a8a8a" strokeOpacity=".25" strokeWidth=".45" />
      </g>
      {/* raised mark: shadow, body, highlight */}
      <g transform="translate(60 60) scale(2)">
        <path d={MARK_D} transform="translate(-4 -3.1)" fill="#000" opacity=".22" />
        <path d={MARK_D} transform="translate(-4 -4)" fill={`url(#${id}-mk)`} />
        <path d={MARK_D} transform="translate(-4 -4)" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".35" />
      </g>
    </svg>
  );
}

/** A minted chrome coin: two detailed faces, a milled edge, a holographic sheen. Sways, tilts to the pointer, flips when a link is made. */
export default function Coin({ size = 220 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState(0);
  const uid = useId().replace(/:/g, "");
  const T = Math.max(6, Math.round(size * 0.085));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${(dx * 40).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-dy * 30).toFixed(2)}deg`);
      });
    };
    const onMade = () => setFlip((f) => f + 1);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("qova:made", onMade);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("qova:made", onMade); cancelAnimationFrame(raf); };
  }, []);

  const face = (cls: string, id: string) => (
    <div className={`c-face ${cls}`}>
      <div className="c-rim" />
      <div className="c-disc"><Face id={id} /></div>
      <div className="c-holo" />
      <div className="c-shine" />
    </div>
  );

  return (
    <div className="coin-stage" style={{ width: size, height: size, ["--t" as string]: `${T}px` }} aria-hidden="true">
      <div ref={ref} className="coin-tilt">
        <div key={flip} className={flip ? "coin3d coin-flip" : "coin3d"}>
          {Array.from({ length: LAYERS }).map((_, i) => (
            <i key={i} className="c-edge" style={{ transform: `translateZ(${(-T / 2 + (T * i) / (LAYERS - 1)).toFixed(2)}px)` }} />
          ))}
          {face("c-front", `${uid}f`)}
          {face("c-back", `${uid}b`)}
        </div>
      </div>
      <div className="coin-shadow" />
    </div>
  );
}
