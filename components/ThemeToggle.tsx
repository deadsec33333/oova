"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
type VT = { ready: Promise<void> };

/** White or black edition. Circle reveal from the button where the browser supports view transitions. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"); }, []);

  const apply = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.dataset.theme = "dark"; else delete root.dataset.theme;
    try { localStorage.setItem("qova-theme", t); } catch { /* ignore */ }
    setTheme(t);
    window.dispatchEvent(new Event("qova:theme"));
  };

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) { apply(next); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = doc.startViewTransition(() => apply(next));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  };

  return (
    <button type="button" className={`theme-btn is-${theme}`} onClick={toggle} aria-label={theme === "dark" ? "Switch to white edition" : "Switch to black edition"} title={theme === "dark" ? "White edition" : "Black edition"}>
      <Sun className="tb-sun" size={17} strokeWidth={1.9} />
      <Moon className="tb-moon" size={16} strokeWidth={1.9} />
    </button>
  );
}
