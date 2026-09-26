"use client";
import { useEffect, useRef, useState } from "react";
import { MARK_D } from "./Logo";

const LAYERS = 14;

/** A real chrome coin: two embossed faces with the QOVA mark and a milled metal edge. Sways, tilts to the pointer, flips when a link is made. */
export default function Coin({ size = 220 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState(0);
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

  const face = (cls: string) => (
    <div className={`c-face ${cls}`}>
      <div className="c-rim" />
      <div className="c-disc">
        <svg className="c-mark" viewBox="4 4 40 40" aria-hidden="true"><path d={MARK_D} /></svg>
      </div>
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
          {face("c-front")}
          {face("c-back")}
        </div>
      </div>
      <div className="coin-shadow" />
    </div>
  );
}
