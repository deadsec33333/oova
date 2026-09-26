"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CornerDownLeft, LogIn, Moon, Search, Sun, Link2 } from "lucide-react";
import { Mark } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import WalletButton from "./WalletButton";

type Item = { slug: string; label: string; href: string; hint: string };
const ITEMS: Item[] = [
  { slug: "how-it-works", label: "How it works", href: "#how", hint: "Watch a payment happen" },
  { slug: "security", label: "Security", href: "#trust", hint: "Why your money never touches us" },
  { slug: "worldwide", label: "Worldwide", href: "#world", hint: "Drag the globe" },
  { slug: "pay", label: "Make a pay link", href: "#make", hint: "The live tool, real USDC" },
  { slug: "token", label: "$QOVA", href: "#coin", hint: "Launch status, anti scam" },
  { slug: "faq", label: "FAQ", href: "#faq", hint: "Plain answers" },
  { slug: "app", label: "Sign in", href: "/app", hint: "Wallet, Google or email" },
];
const SLUG: Record<string, string> = {
  Home: "", "How it works": "how-it-works", Features: "features", Security: "security", Worldwide: "worldwide",
  "Pay link": "pay", "For you": "for-you", "The coin": "story", $QOVA: "token", Community: "community", FAQ: "faq",
};

type L = { stop: () => void; start: () => void; scrollTo: (t: string | number, o?: object) => void };
const lenis = () => (window as unknown as { __lenis?: L }).__lenis;

/** The nav is a link. It retypes itself as you scroll and opens a command bar (⌘K). */
export default function Nav() {
  const [slug, setSlug] = useState("");
  const [shown, setShown] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [act, setAct] = useState(0);
  const [dark, setDark] = useState(false);
  const [mac, setMac] = useState(true);
  const fill = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // section + progress + dark surface
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    const read = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      if (fill.current) fill.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]"));
      const line = window.innerHeight * 0.4;
      let cur = "Home";
      secs.forEach((el) => { if (el.getBoundingClientRect().top <= line) cur = el.dataset.nav || cur; });
      setSlug(SLUG[cur] ?? "");
      setDark(document.documentElement.dataset.theme === "dark" || Array.from(document.querySelectorAll(".band, .foot")).some((el) => { const r = el.getBoundingClientRect(); return r.top <= 36 && r.bottom >= 36; }));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    window.addEventListener("qova:theme", read);
    return () => { window.removeEventListener("scroll", read); window.removeEventListener("resize", read); window.removeEventListener("qova:theme", read); };
  }, []);

  // typewriter: delete the old path, type the new one
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(slug); return; }
    let cur = shown;
    let common = 0;
    while (common < cur.length && common < slug.length && cur[common] === slug[common]) common++;
    let deleting = cur.length > common;
    const id = setInterval(() => {
      if (deleting) { cur = cur.slice(0, -1); setShown(cur); if (cur.length <= common) deleting = false; return; }
      if (cur.length < slug.length) { cur = slug.slice(0, cur.length + 1); setShown(cur); if (cur.length % 2) window.dispatchEvent(new Event("qova:key")); return; }
      clearInterval(id);
    }, 26);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^\//, "");
    if (!s) return ITEMS;
    const score = (i: Item) => (i.slug.startsWith(s) ? 0 : i.label.toLowerCase().split(/\s+/).some((w) => w.replace("$", "").startsWith(s)) ? 1 : i.slug.includes(s) || i.label.toLowerCase().includes(s) ? 2 : i.hint.toLowerCase().includes(s) ? 3 : 9);
    return ITEMS.map((i) => [score(i), i] as const).filter(([sc]) => sc < 9).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
  }, [q]);

  const close = useCallback(() => { setOpen(false); setQ(""); setAct(0); }, []);
  const go = useCallback((it: Item) => {
    close();
    if (it.href.startsWith("#")) {
      const l = lenis();
      if (l) setTimeout(() => l.scrollTo(it.href, { offset: -84 }), 40); else document.querySelector(it.href)?.scrollIntoView({ behavior: "smooth" });
    } else window.location.href = it.href;
  }, [close]);

  // keyboard: ⌘K, Ctrl K or / opens; arrows move; enter goes; esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !open)) { e.preventDefault(); setOpen((o) => !o); return; }
      if (!open) return;
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setAct((a) => (a + 1) % Math.max(1, results.length)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => (a - 1 + results.length) % Math.max(1, results.length)); }
      else if (e.key === "Enter" && results[act]) { e.preventDefault(); go(results[act]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, act, go, close]);

  useEffect(() => {
    if (!open) { lenis()?.start(); return; }
    lenis()?.stop();
    setTimeout(() => input.current?.focus(), 30);
    const out = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    window.addEventListener("pointerdown", out);
    return () => window.removeEventListener("pointerdown", out);
  }, [open, close]);

  useEffect(() => { setAct(0); }, [q]);

  return (
    <header className={`lnav${dark ? " is-dark" : ""}${open ? " is-open" : ""}`}>
      <div className="lnav-wrap" ref={wrap}>
        <div className="lbar">
          <a href="#top" className="lbar-mark" aria-label="QOVA home" onClick={(e) => { e.preventDefault(); close(); const l = lenis(); if (l) l.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" }); }}><Mark size={18} /></a>
          {open ? (
            <div className="lbar-path is-input">
              <span className="lbar-fill" ref={fill} aria-hidden="true" />
              <span className="lbar-in"><span className="lbar-root">qova/</span><input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="where to?" aria-label="Search sections" aria-controls="lnav-cmd" spellCheck={false} autoComplete="off" /></span>
              <button type="button" className="lbar-kbd mono" onClick={close} aria-label="Close navigation">esc</button>
            </div>
          ) : (
            <button type="button" className="lbar-path" onClick={() => setOpen(true)} aria-expanded={false} aria-controls="lnav-cmd" aria-label={`Current section ${slug || "home"}. Open navigation`}>
              <span className="lbar-fill" ref={fill} aria-hidden="true" />
              <span className="lbar-in" aria-hidden="true"><span className="lbar-root">qova/</span><span className="lbar-slug">{shown}</span><i className="lbar-caret" /></span>
              <span className="lbar-kbd mono" aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</span>
            </button>
          )}
          <div className="lbar-right">
            <ThemeToggle />
            <WalletButton />
            <a href="#make" className="lbar-cta" onClick={(e) => { e.preventDefault(); go(ITEMS[3]); }}><span>Make a link</span><ArrowUpRight size={16} strokeWidth={2.2} /></a>
          </div>
        </div>

        <div id="lnav-cmd" className="lcmd" role="listbox" aria-hidden={!open}>
          <div className="lcmd-head mono"><Search size={13} /> Jump to</div>
          {results.length === 0 && <div className="lcmd-empty">No page called <b>/{q}</b>. Try &quot;pay&quot; or &quot;faq&quot;.</div>}
          {results.map((it, i) => (
            <button key={it.slug} type="button" role="option" aria-selected={i === act} tabIndex={open ? 0 : -1} className={`lcmd-row${i === act ? " is-on" : ""}${it.slug === slug ? " is-here" : ""}`} onMouseEnter={() => setAct(i)} onClick={() => go(it)}>
              <span className="mono lcmd-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="lcmd-ico">{it.slug === "app" ? <LogIn size={15} /> : it.slug === "pay" ? <Link2 size={15} /> : <span className="mono">/</span>}</span>
              <span className="lcmd-t"><b>{it.label}</b><span className="mono">qova/{it.slug}</span></span>
              <span className="lcmd-hint">{it.hint}</span>
              <CornerDownLeft size={14} className="lcmd-enter" />
            </button>
          ))}
          <div className="lcmd-foot mono"><span>↑ ↓ move</span><span>↵ go</span><span>esc close</span><span className="lcmd-theme"><Sun size={12} /><Moon size={12} /> theme in the bar</span></div>
        </div>
      </div>
    </header>
  );
}
