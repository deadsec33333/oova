"use client";
import { useEffect, useRef } from "react";
import TokenIcon, { type TokenKind } from "./TokenIcon";

const ORBIT: TokenKind[] = ["usdc", "sol", "ngn", "php", "brl", "kes", "usdc", "idr"];

/** Tokens orbiting the coin on a tilted ellipse, passing behind and in front of it. */
export default function HeroOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".orb"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, t = 0, visible = true, last = performance.now();
    const place = () => {
      const w = root.clientWidth, h = root.clientHeight;
      const rx = w * 0.46, ry = h * 0.2, tilt = -0.2;
      items.forEach((el, k) => {
        const a = t + (k / items.length) * Math.PI * 2;
        const x = Math.cos(a) * rx, y0 = Math.sin(a) * ry;
        const y = y0 + x * Math.sin(tilt) * 0.5;
        const depth = (Math.sin(a) + 1) / 2;
        const sc = 0.62 + depth * 0.48;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
        el.style.zIndex = depth > 0.5 ? "3" : "1";
        el.style.opacity = (0.45 + depth * 0.55).toFixed(2);
        el.style.filter = depth < 0.35 ? `blur(${((0.35 - depth) * 4).toFixed(1)}px)` : "none";
      });
    };
    const loop = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      t += dt * 0.00022;
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
      {ORBIT.map((k, i) => (
        <div key={i} className="orb"><TokenIcon kind={k} size={44} /></div>
      ))}
    </div>
  );
}
