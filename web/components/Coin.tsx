"use client";
import { useEffect, useRef, useState } from "react";

/** Qova: a chrome coin with no face and a tail. Tilts toward you, flips when a link is made. */
export default function Coin({ size = 220 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState(0);

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
        el.style.setProperty("--ry", `${(dx * 36).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-dy * 30).toFixed(2)}deg`);
      });
    };
    const onMade = () => setFlip((f) => f + 1);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("qova:made", onMade);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("qova:made", onMade);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="coin-stage" style={{ width: size, height: size }} aria-hidden="true">
      <div ref={ref} className="coin-tilt">
        <div key={flip} className={flip ? "coin coin-flip" : "coin"}>
          <div className="coin-rim" />
          <div className="coin-face" />
          <div className="coin-shine" />
          <div className="coin-tail" />
        </div>
      </div>
      <div className="coin-shadow" />
    </div>
  );
}
