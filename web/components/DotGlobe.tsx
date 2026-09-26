"use client";
import { useEffect, useRef } from "react";

/** Halftone dot globe on canvas. Slow spin, static when reduced motion is on. */
export default function DotGlobe({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = 900;
    const pts: [number, number, number][] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = g * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    let raf = 0;
    let a = 0.6;
    let visible = true;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.46;
      const cx = w / 2, cy = h / 2;
      const ca = Math.cos(a), sa = Math.sin(a), tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (const [x, y, z] of pts) {
        const x1 = x * ca - z * sa;
        const z1 = x * sa + z * ca;
        const y2 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        if (z2 < -0.15) continue;
        const d = (z2 + 1) / 2;
        ctx.globalAlpha = 0.12 + d * 0.7;
        ctx.fillStyle = d > 0.82 ? "#19C39B" : "#AEB8C4";
        ctx.beginPath();
        ctx.arc(cx + x1 * R, cy + y2 * R, 0.6 + d * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce && visible) { a += 0.0022; raf = requestAnimationFrame(draw); }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) draw();
    });
    io.observe(canvas);
    draw();
    const onResize = () => { cancelAnimationFrame(raf); draw(); };
    window.addEventListener("resize", onResize);
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
