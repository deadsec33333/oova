"use client";
import { useEffect, useRef } from "react";
import TokenIcon, { type TokenKind } from "./TokenIcon";

const ORBIT: { k: TokenKind; s: number }[] = [
  { k: "sol", s: 62 }, { k: "bonk", s: 44 }, { k: "usdc", s: 58 }, { k: "doge", s: 50 },
  { k: "wif", s: 42 }, { k: "btc", s: 46 }, { k: "jup", s: 40 }, { k: "eth", s: 44 },
];

/** Glossy tokens orbiting the coin on a tilted ellipse, passing behind and in front of it. */
export default function HeroOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".orb"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, t = 0.4, visible = true, last = performance.now();
    const coin = root.parentElement?.querySelector<HTMLElement>(".coin-stage");
    const place = () => {
      const w = root.clientWidth, h = root.clientHeight;
      // keep every coin clear of the big coin: the ellipse always stays outside its radius
      const R = coin ? coin.offsetWidth / 2 : 110;
      const tok = 34;
      const ry = Math.max(h * 0.3, R + tok + 6);
      const rx = Math.max(w * 0.44, ry * 1.3);
      items.forEach((el, k) => {
        const a = t + (k / items.length) * Math.PI * 2;
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        const depth = (Math.sin(a) + 1) / 2;
        const sc = 0.86 + depth * 0.24;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
        el.style.zIndex = String(10 + Math.round(depth * 10));
      });
    };
    const loop = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      t += dt * 0.00018;
      place();
      if (visible) raf = requestAnimationFrame(loop);
    };
    place();
    if (reduce) return;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); } });
    io.observe(root);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} className="orbit-field" aria-hidden="true">
      {ORBIT.map((o, i) => (
        <div key={i} className="orb" style={{ width: o.s, height: o.s, margin: `${-o.s / 2}px 0 0 ${-o.s / 2}px` }}>
          <div className="orb-in" style={{ animationDelay: `${-i * 0.7}s` }}><TokenIcon kind={o.k} size={o.s} /></div>
        </div>
      ))}
    </div>
  );
}
