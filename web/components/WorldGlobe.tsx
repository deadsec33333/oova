"use client";
import { useEffect, useRef } from "react";

const CITIES: [string, number, number][] = [
  ["Lagos", 6.5, 3.4], ["Accra", 5.6, -0.2], ["Nairobi", -1.3, 36.8], ["Johannesburg", -26.2, 28.0],
  ["Cairo", 30.0, 31.2], ["Lima", -12.0, -77.0], ["São Paulo", -23.5, -46.6], ["Buenos Aires", -34.6, -58.4],
  ["Mexico City", 19.4, -99.1], ["Bogotá", 4.7, -74.1], ["Manila", 14.6, 121.0], ["Jakarta", -6.2, 106.8],
  ["Ho Chi Minh City", 10.8, 106.7], ["Dhaka", 23.8, 90.4], ["Karachi", 24.9, 67.0], ["New York", 40.7, -74.0],
  ["London", 51.5, -0.1], ["Dubai", 25.2, 55.3], ["Vilnius", 54.7, 25.3], ["Seoul", 37.6, 127.0],
];

type V = [number, number, number];
const toV = (lat: number, lon: number): V => {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
};
const slerp = (a: V, b: V, t: number): V => {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const w = Math.acos(d);
  if (w < 1e-4) return a;
  const s = Math.sin(w), k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
};

/** Halftone globe with sample payment arcs between cities. Drag to spin. */
export default function WorldGlobe({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = 1400;
    const pts: V[] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const t = g * i; pts.push([Math.cos(t) * r, y, Math.sin(t) * r]); }
    const cities = CITIES.map(([n, la, lo]) => ({ n, v: toV(la, lo) }));
    type Arc = { a: number; b: number; t: number; speed: number };
    const arcs: Arc[] = [];
    const spawn = () => {
      let a = Math.floor(Math.random() * cities.length), b = Math.floor(Math.random() * cities.length);
      if (a === b) b = (b + 5) % cities.length;
      arcs.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.004 });
    };
    for (let i = 0; i < 5; i++) { spawn(); arcs[i].t = Math.random(); }

    let rot = -1.2, vel = 0.0025, drag = false, lastX = 0, raf = 0, visible = true;
    const tilt = 0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
    const project = (v: V) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      const x1 = v[0] * c - v[2] * s, z1 = v[0] * s + v[2] * c;
      const y2 = v[1] * ct - z1 * st, z2 = v[1] * st + z1 * ct;
      return [x1, -y2, z2] as V;
    };

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.44, cx = w / 2, cy = h / 2;
      // atmosphere
      const grd = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
      grd.addColorStop(0, "rgba(255,255,255,0.07)"); grd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2); ctx.fill();
      for (const p of pts) {
        const [x, y, z] = project(p);
        if (z < -0.05) continue;
        const d = (z + 1) / 2;
        ctx.globalAlpha = 0.1 + d * 0.55;
        ctx.fillStyle = "#8a8a8a";
        ctx.fillRect(cx + x * R, cy + y * R, 0.7 + d * 1.3, 0.7 + d * 1.3);
      }
      // arcs
      for (const arc of arcs) {
        const A = cities[arc.a].v, B = cities[arc.b].v;
        const head = Math.min(1, arc.t * 1.4), tail = Math.max(0, arc.t * 1.4 - 0.45);
        ctx.lineWidth = 1.6; ctx.lineCap = "round";
        let prev: [number, number, number] | null = null;
        for (let k = 0; k <= 40; k++) {
          const tt = tail + (head - tail) * (k / 40);
          const v = slerp(A, B, tt);
          const lift = 1 + 0.28 * Math.sin(Math.PI * tt);
          const [x, y, z] = project([v[0] * lift, v[1] * lift, v[2] * lift]);
          if (prev && z > -0.2 && prev[2] > -0.2) {
            ctx.globalAlpha = 0.25 + 0.75 * (k / 40);
            ctx.strokeStyle = "#ffffff";
            ctx.beginPath(); ctx.moveTo(cx + prev[0] * R, cy + prev[1] * R); ctx.lineTo(cx + x * R, cy + y * R); ctx.stroke();
          }
          prev = [x, y, z];
        }
        if (prev && prev[2] > -0.2 && head < 1) {
          ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(cx + prev[0] * R, cy + prev[1] * R, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      // cities
      ctx.font = "500 10px ui-monospace, SFMono-Regular, monospace";
      for (const c of cities) {
        const [x, y, z] = project(c.v);
        if (z < 0.05) continue;
        ctx.globalAlpha = Math.min(1, z * 2);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx + x * R, cy + y * R, 2.4, 0, Math.PI * 2); ctx.fill();
        if (z > 0.35 && w > 360) { ctx.fillStyle = "#bdbdbd"; ctx.fillText(c.n.toUpperCase(), cx + x * R + 6, cy + y * R + 3); }
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (!drag) { rot += vel; vel += (0.0025 - vel) * 0.02; }
      for (let i = arcs.length - 1; i >= 0; i--) { arcs[i].t += arcs[i].speed; if (arcs[i].t > 1.05) { arcs.splice(i, 1); spawn(); } }
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };
    const down = (e: PointerEvent) => { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-drag"); };
    const move = (e: PointerEvent) => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; rot += dx * 0.006; vel = dx * 0.006; if (reduce) draw(); };
    const up = () => { drag = false; canvas.classList.remove("is-drag"); };
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

    draw();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && !reduce) raf = requestAnimationFrame(loop); });
    io.observe(canvas);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-label="Globe with sample payment routes between cities. Drag to spin." role="img" />;
}
