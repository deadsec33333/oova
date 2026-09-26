"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Mark } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Btn from "./Btn";

const LINKS: [string, string][] = [
  ["How it works", "#how"], ["Security", "#trust"], ["Worldwide", "#world"], ["Pay link", "#make"], ["$QOVA", "#coin"], ["FAQ", "#faq"],
];

type L = { stop: () => void; start: () => void; scrollTo: (t: string | number, o?: object) => void };
const lenis = () => (window as unknown as { __lenis?: L }).__lenis;

/** Dynamic island navigation: a black capsule that shows where you are and expands into the menu. */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(true);
  const [hover, setHover] = useState(false);
  const [sec, setSec] = useState({ label: "Home", i: 0, n: 1 });
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const read = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      setTop(y < 80);
      if (ring.current) ring.current.style.strokeDashoffset = String(1 - (max > 0 ? Math.min(1, y / max) : 0));
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]"));
      const line = window.innerHeight * 0.4;
      let idx = 0;
      secs.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) idx = i; });
      const label = secs[idx]?.dataset.nav || "Home";
      setSec((s) => (s.label === label && s.n === secs.length ? s : { label, i: idx, n: secs.length }));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => { window.removeEventListener("scroll", read); window.removeEventListener("resize", read); };
  }, []);

  useEffect(() => {
    if (open) { lenis()?.stop(); document.body.style.overflow = "hidden"; } else { lenis()?.start(); document.body.style.overflow = ""; }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false); setHover(false);
    const l = lenis();
    if (l) { e.preventDefault(); setTimeout(() => l.scrollTo(href === "#top" ? 0 : href, { offset: -84 }), 60); }
  };

  const wide = top || hover || open;

  return (
    <>
      <header className={`nav${wide ? " is-wide" : ""}${open ? " is-open" : ""}`}>
        <div className="island" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(false); }}>
          <a href="#top" className="isl-logo" aria-label="QOVA home" onClick={go("#top")}>
            <svg className="isl-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" className="isl-ring-bg" /><circle ref={ring} cx="20" cy="20" r="18" pathLength={1} className="isl-ring-fg" /></svg>
            <Mark size={18} className="isl-mark" />
          </a>
          <span className="isl-word">QOVA</span>
          <div className="isl-mid">
            <div className="isl-label" aria-live="polite">
              <span key={sec.label} className="isl-sec">{sec.label}</span>
              <span className="isl-idx mono">{String(sec.i + 1).padStart(2, "0")}/{String(sec.n).padStart(2, "0")}</span>
            </div>
            <nav className="isl-links" aria-label="Sections">
              {LINKS.map(([t, h]) => <a key={h} href={h} onClick={go(h)} tabIndex={wide ? 0 : -1}><span data-text={t}><span>{t}</span></span></a>)}
            </nav>
          </div>
          <div className="isl-right">
            <ThemeToggle />
            <a href="/app" className="isl-app">Sign in</a>
            <a href="#make" className="isl-cta" onClick={go("#make")} aria-label="Make a pay link"><span>Make a link</span><ArrowUpRight size={16} strokeWidth={2.2} /></a>
            <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}><i /><i /></button>
          </div>
        </div>
      </header>
      <div className={`menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav className="menu-links" aria-label="Menu">
          {LINKS.map(([t, h], i) => (
            <a key={h} href={h} onClick={go(h)} style={{ ["--i" as string]: i }} tabIndex={open ? 0 : -1}>
              <span className="mono">0{i + 1}</span>{t}
            </a>
          ))}
          <a href="/app" style={{ ["--i" as string]: LINKS.length }} tabIndex={open ? 0 : -1}><span className="mono">0{LINKS.length + 1}</span>Sign in</a>
        </nav>
        <div className="menu-foot" style={{ ["--i" as string]: LINKS.length }} onClickCapture={go("#make")}>
          <Btn href="#make" variant="light" size="lg" magnetic={false}>Make your pay link</Btn>
          <p className="mono">Dollars for everyone. One link away.</p>
        </div>
      </div>
    </>
  );
}
