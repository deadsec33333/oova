"use client";
import { useEffect, useState } from "react";

/** Entry ritual: the Q draws itself, then the page opens. Once per session, skippable, off for reduced motion. */
export default function Loader() {
  const [state, setState] = useState<"show" | "leave" | "gone">("show");
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("qova-intro") === "1"; sessionStorage.setItem("qova-intro", "1"); } catch { /* ignore */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ready = () => { (window as unknown as { __qovaReady?: boolean }).__qovaReady = true; window.dispatchEvent(new Event("qova:ready")); };
    if (seen || reduce) { setState("gone"); ready(); return; }
    const a = setTimeout(() => { setState("leave"); ready(); }, 1250);
    const b = setTimeout(() => setState("gone"), 2000);
    const skip = () => { clearTimeout(a); setState("leave"); ready(); setTimeout(() => setState("gone"), 700); };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => { clearTimeout(a); clearTimeout(b); window.removeEventListener("pointerdown", skip); window.removeEventListener("keydown", skip); };
  }, []);
  if (state === "gone") return null;
  return (
    <div className={state === "leave" ? "loader is-leaving" : "loader"} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="loader-q">
        <defs><linearGradient id="lq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#b9c1ca" /><stop offset="1" stopColor="#6d7682" /></linearGradient></defs>
        <circle className="lq-ring" cx="56" cy="56" r="36" fill="none" stroke="url(#lq)" strokeWidth="12" strokeLinecap="round" />
        <path className="lq-tail" d="M78 78 L100 100" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <div className="loader-word">QOVA</div>
    </div>
  );
}
