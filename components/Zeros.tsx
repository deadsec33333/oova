"use client";
import { useEffect, useRef } from "react";

const Z = [
  { from: 1000000, t: "dollars we hold for you", d: "No balances, no vault. Money sits in your wallet only." },
  { from: 24, t: "private keys we store", d: "We never see a seed phrase. Nothing to leak." },
  { from: 12, t: "transactions we ask you to sign", d: "Making a link needs no wallet connection at all." },
  { from: 99, t: "accounts we can freeze", d: "There is no QOVA account holding your money." },
];

/** Big numbers that count down to an honest zero. */
export default function Zeros() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nums = Array.from(root.querySelectorAll<HTMLElement>(".z-n"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { nums.forEach((n) => (n.textContent = "0")); return; }
    let done = false;
    const run = () => {
      if (done) return; done = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1900);
        const e = 1 - Math.pow(1 - p, 4);
        nums.forEach((n, i) => { const v = Math.round(Z[i].from * (1 - e)); n.textContent = v.toLocaleString("en-US"); });
        if (p < 1) requestAnimationFrame(tick); else root.classList.add("is-zero");
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(root);
    return () => io.disconnect();
  }, []);
  return (
    <div className="zeros" ref={ref}>
      {Z.map((z) => (
        <div key={z.t} className="zero">
          <span className="z-n">{z.from.toLocaleString("en-US")}</span>
          <b>{z.t}</b>
          <p>{z.d}</p>
        </div>
      ))}
    </div>
  );
}
