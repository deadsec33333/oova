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
      <svg viewBox="4 4 40 40" className="loader-q">
        <path className="lq-draw" pathLength={1} d="M38 35.81 L38 22 A16 16 0 1 0 22 38 L35.81 38 L26.165 28.357 A7.6 7.6 0 1 1 28.357 26.165 Z" />
      </svg>
      <div className="loader-word">QOVA</div>
    </div>
  );
}
