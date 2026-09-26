"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Btn from "./Btn";

const LINKS = [
  ["How it works", "#how"], ["Worldwide", "#world"], ["Pay link", "#make"], ["$QOVA", "#coin"], ["FAQ", "#faq"],
];

type L = { stop: () => void; start: () => void; scrollTo: (t: string, o?: object) => void; on: (e: string, f: (l: { scroll: number; limit: number }) => void) => void };

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => {
      setScrolled(window.scrollY > 24);
      const y = 38;
      setDark(document.documentElement.dataset.theme === "dark" || Array.from(document.querySelectorAll(".band, .foot")).some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("qova:theme", read);
    return () => { window.removeEventListener("scroll", read); window.removeEventListener("qova:theme", read); };
  }, []);

  useEffect(() => {
    const l = (window as unknown as { __lenis?: L }).__lenis;
    if (open) { l?.stop(); document.body.style.overflow = "hidden"; } else { l?.start(); document.body.style.overflow = ""; }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    const l = (window as unknown as { __lenis?: L }).__lenis;
    if (l) { e.preventDefault(); setTimeout(() => l.scrollTo(href, { offset: -80 }), 60); }
  };

  return (
    <>
      <header className={`nav${scrolled ? " is-scrolled" : ""}${dark ? " is-dark" : ""}${open ? " is-open" : ""}`}>
        <div className="nav-pill">
          <a href="#top" className="brand" aria-label="QOVA home" onClick={go("#top")}>
            <Logo />
          </a>
          <nav className="nav-links" aria-label="Sections">
            {LINKS.map(([t, h]) => <a key={h} href={h} onClick={go(h)}><span data-text={t}><span>{t}</span></span></a>)}
          </nav>
          <div className="nav-right">
            <ThemeToggle />
            <Btn href="#make" size="sm" className="nav-cta">Make a link</Btn>
            <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <i /><i />
            </button>
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
        </nav>
        <div className="menu-foot" style={{ ["--i" as string]: LINKS.length }} onClickCapture={go("#make")}>
          <Btn href="#make" variant="light" size="lg" magnetic={false}>Make your pay link</Btn>
          <p className="mono">Dollars for everyone. One link away.</p>
        </div>
      </div>
    </>
  );
}
