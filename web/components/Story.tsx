"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BatteryFull, Check, ChevronsRight, Copy, Delete, Keyboard, Link as LinkIcon, Mail, MessageCircle,
  QrCode, ScanFace, Send, Share2, Signal, Wallet, Wifi, X, CircleCheck,
} from "lucide-react";
import TokenIcon from "./TokenIcon";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { k: "01", Icon: Keyboard, t: "Type the amount", d: "Your address and 25.00 USDC. That is the whole form." },
  { k: "02", Icon: Share2, t: "Share the link", d: "Chat, Telegram, email, a QR on the counter. Anywhere." },
  { k: "03", Icon: Wallet, t: "They pay from any wallet", d: "One slide in Phantom, Solflare or Backpack. No sign up." },
  { k: "04", Icon: CircleCheck, t: "Dollars arrive", d: "The exact amount lands in your wallet, usually within seconds." },
];
const TAGS = ["Solana Pay request", "Link · QR · chat", "Fee under $0.01", "Wallet to wallet"];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const TYPE = ["2", "5", ".", "0", "0"];
// timeline marks (seconds on the scrubbed timeline)
const T = { s2: 2.4, s3: 4.6, s4: 6.6, end: 8.6 };

/** A payment played on a phone, driven by scroll. Sample data. */
export default function Story() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = Array.from(root.querySelectorAll<HTMLElement>(".st-step"));
    const tags = Array.from(root.querySelectorAll<HTMLElement>(".st-tag"));
    let cur = -1;
    const setStep = (i: number) => {
      if (i === cur) return;
      if (cur !== -1) window.dispatchEvent(new CustomEvent("qova:step", { detail: i }));
      cur = i;
      steps.forEach((s, n) => { s.classList.toggle("is-on", n === i); s.classList.toggle("is-done", n < i); });
      tags.forEach((s, n) => s.classList.toggle("is-on", n === i));
    };
    setStep(0);
    if (reduce) { root.classList.add("story-static"); return; }

    const q = gsap.utils.selector(root);
    const digits = q(".ps-d");
    const keyEl = (k: string) => root.querySelector(`.ps-key[data-k="${k === "." ? "dot" : k}"]`);
    const got = root.querySelector<HTMLElement>(".ps-got-v");
    const fill = root.querySelector<HTMLElement>(".st-rail-fill");
    const counter = { g: 0 };

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ desk: "(min-width: 900px)", mob: "(max-width: 899px)" }, (c) => {
        const desk = c.conditions?.desk;
        gsap.set(digits, { yPercent: 100, opacity: 0, maxWidth: 0 });
        const tl = gsap.timeline({
          defaults: { ease: "power3.inOut" },
          scrollTrigger: { trigger: root, start: "top top", end: desk ? "+=3400" : "+=2800", pin: true, scrub: 1.2, anticipatePin: 1 },
        });

        // phone floats in 3D across the whole story
        tl.fromTo(".phone", { rotateY: desk ? -14 : -7, rotateX: desk ? 6 : 3, y: desk ? 30 : 0 }, { rotateY: desk ? 12 : 7, rotateX: desk ? -2 : -1, y: desk ? -10 : 0, ease: "none", duration: T.end }, 0);

        // 1 type the amount on the keypad
        TYPE.forEach((k, i) => {
          const at = 0.25 + i * 0.3;
          const key = keyEl(k);
          tl.call(() => { window.dispatchEvent(new Event("qova:key")); }, [], at);
          if (key) tl.to(key, { backgroundColor: "#0A0A0A", color: "#fff", scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, at);
          tl.to(digits[i], { yPercent: 0, opacity: 1, maxWidth: "0.75em", duration: 0.2, ease: "back.out(2)" }, at + 0.05);
        });
        tl.from(".ps-to-fill", { clipPath: "inset(0 100% 0 0)", duration: 0.5, ease: "none" }, 1.7)
          .to(".scr-1 .ps-cta", { scale: 0.95, backgroundColor: "#333", duration: 0.12, yoyo: true, repeat: 1 }, 2.1)

        // 2 share
          .to(".scr-1", { yPercent: -6, scale: 0.96, opacity: 0, duration: 0.35 }, T.s2)
          .fromTo(".scr-2", { yPercent: 6, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 }, T.s2 + 0.1)
          .from(".ps-linkcard", { y: 20, opacity: 0, scale: 0.96, duration: 0.4, ease: "back.out(1.6)" }, T.s2 + 0.25)
          .fromTo(".ps-sheet", { yPercent: 105 }, { yPercent: 0, duration: 0.5, ease: "power3.out" }, T.s2 + 0.55)
          .from(".ps-app", { y: 14, opacity: 0, stagger: 0.05, duration: 0.3 }, T.s2 + 0.75)
          .to(".ps-app-chat .ps-app-ico", { scale: 0.86, backgroundColor: "#0A0A0A", color: "#fff", duration: 0.12, yoyo: true, repeat: 1 }, T.s2 + 1.15)
          .to(".ps-sheet", { yPercent: 105, duration: 0.4, ease: "power3.in" }, T.s2 + 1.35)
          .fromTo(".ps-chat", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, T.s2 + 1.5)
          .fromTo(".ps-typing", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2 }, T.s2 + 1.55)
          .to(".ps-typing", { opacity: 0, scale: 0.8, duration: 0.15 }, T.s2 + 1.85)
          .fromTo(".ps-bubble", { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, T.s2 + 1.9)

        // 3 pay
          .to(".scr-2", { yPercent: -6, scale: 0.96, opacity: 0, duration: 0.35 }, T.s3)
          .fromTo(".scr-3", { yPercent: 6, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 }, T.s3 + 0.1)
          .from(".scr-3 .ps-row", { x: -14, opacity: 0, stagger: 0.06, duration: 0.3 }, T.s3 + 0.35)
          .to(".ps-knob", { x: () => { const t = root.querySelector<HTMLElement>(".ps-track"); const k = root.querySelector<HTMLElement>(".ps-knob"); return t && k ? t.clientWidth - k.clientWidth - 8 : 180; }, duration: 0.8, ease: "power2.inOut" }, T.s3 + 0.7)
          .to(".ps-track-fill", { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, T.s3 + 0.7)
          .to(".ps-track-t", { opacity: 0, duration: 0.2 }, T.s3 + 0.7)
          .fromTo(".ps-face", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, T.s3 + 1.5)
          .to(".ps-face", { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1 }, T.s3 + 1.8)

        // 4 arrive
          .to(".scr-3", { yPercent: -6, scale: 0.96, opacity: 0, duration: 0.35 }, T.s4)
          .fromTo(".scr-4", { yPercent: 6, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 }, T.s4 + 0.1)
          .fromTo(".ps-ring-c", { strokeDashoffset: 302 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, T.s4 + 0.2)
          .fromTo(".ps-ring-k", { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, T.s4 + 0.7)
          .fromTo(counter, { g: 0 }, { g: 25, duration: 0.7, ease: "power2.out", onUpdate: () => { if (got) got.textContent = `+${counter.g.toFixed(2)}`; } }, T.s4 + 0.5)
          .fromTo(".ps-spark", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.02, duration: 0.4, ease: "expo.out" }, T.s4 + 0.75)
          .to(".ps-spark", { opacity: 0, duration: 0.4 }, T.s4 + 1.3)
          .fromTo(".ps-banner", { yPercent: -160 }, { yPercent: 0, duration: 0.45, ease: "back.out(1.4)" }, T.s4 + 0.9)
          .from(".ps-receipt > *", { y: 12, opacity: 0, stagger: 0.07, duration: 0.3 }, T.s4 + 1.0)
          .to(".st-halo", { scale: 1.25, opacity: 1, duration: 0.8 }, T.s4 + 0.4)
          .to({}, { duration: 0.6 });

        tl.eventCallback("onUpdate", () => {
          const t = tl.time();
          setStep(t < T.s2 ? 0 : t < T.s3 ? 1 : t < T.s4 ? 2 : 3);
          if (fill) fill.style.transform = `scaleY(${Math.min(1, t / (T.s4 + 1.2)).toFixed(3)})`;
        });
        return () => tl.kill();
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="story" id="how" aria-label="How a payment happens">
      <div className="wrap story-inner">
        <div className="st-copy">
          <p className="kicker mono"><span className="sq" />How it works</p>
          <h2 className="h2 st-title">Watch a payment happen.</h2>
          <div className="st-list">
            <div className="st-rail" aria-hidden="true"><i className="st-rail-fill" /></div>
            <ol className="st-steps">
              {STEPS.map(({ k, Icon, t, d }) => (
                <li key={k} className="st-step">
                  <span className="st-num"><Icon size={18} strokeWidth={1.8} /></span>
                  <div className="st-txt"><span className="mono st-k">{k}</span><b>{t}</b><p>{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <p className="fine mono st-note">Animation with sample data</p>
        </div>

        <div className="st-stage" aria-hidden="true">
          <div className="st-halo" />
          {TAGS.map((t, i) => <span key={t} className={`st-tag st-tag-${i}`}><Check size={12} strokeWidth={3} />{t}</span>)}
          <div className="phone">
            <i className="phone-btn pb-1" /><i className="phone-btn pb-2" /><i className="phone-btn pb-3" />
            <div className="phone-screen">
              <div className="ps-status">
                <span className="ps-time">9:41</span>
                <span className="ps-island" />
                <span className="ps-sys"><Signal size={12} strokeWidth={2.5} /><Wifi size={12} strokeWidth={2.5} /><BatteryFull size={16} strokeWidth={2} /></span>
              </div>
              <div className="ps-banner">
                <TokenIcon kind="qova" size={30} />
                <div><b>QOVA</b><span>+25.00 USDC received</span></div>
                <span className="ps-now">now</span>
              </div>

              {/* 1 */}
              <div className="scr scr-1">
                <div className="ps-head"><span>New pay link</span><X size={16} /></div>
                <div className="ps-amount">
                  <TokenIcon kind="usdc" size={26} />
                  <span className="ps-digits">{TYPE.map((c, i) => <span key={i} className="ps-d">{c}</span>)}<span className="ps-caret" /></span>
                  <small>USDC</small>
                </div>
                <div className="ps-to">
                  <span className="ps-av">A</span>
                  <span className="ps-to-fill"><b>Ada Studio</b><span className="mono">7xKX…9fQ2</span></span>
                </div>
                <div className="ps-keys">
                  {KEYS.map((k) => <span key={k} className="ps-key" data-k={k === "." ? "dot" : k}>{k === "del" ? <Delete size={15} /> : k}</span>)}
                </div>
                <div className="ps-cta"><LinkIcon size={15} /> Create link</div>
              </div>

              {/* 2 */}
              <div className="scr scr-2">
                <div className="ps-head"><span>Link ready</span><Copy size={15} /></div>
                <div className="ps-linkcard">
                  <div className="ps-qr"><QrCode size={46} strokeWidth={1.4} /></div>
                  <div className="ps-lc-t"><b>25.00 USDC</b><span className="mono">qova/pay?amount=25.00</span></div>
                </div>
                <div className="ps-chat">
                  <div className="ps-chat-h"><span className="ps-av ps-av-s">M</span><b>Marco · Manila</b></div>
                  <div className="ps-typing"><i /><i /><i /></div>
                  <div className="ps-bubble">
                    <span>Pay me 25.00 USDC for the logo</span>
                    <div className="ps-preview"><TokenIcon kind="qova" size={22} /><div><b>Pay 25.00 USDC</b><span className="mono">qova/pay</span></div></div>
                  </div>
                </div>
                <div className="ps-sheet">
                  <i className="ps-handle" />
                  <span className="ps-sheet-t">Share link</span>
                  <div className="ps-apps">
                    <span className="ps-app ps-app-chat"><span className="ps-app-ico"><MessageCircle size={18} /></span>Chats</span>
                    <span className="ps-app"><span className="ps-app-ico"><Send size={18} /></span>Telegram</span>
                    <span className="ps-app"><span className="ps-app-ico"><Mail size={18} /></span>Mail</span>
                    <span className="ps-app"><span className="ps-app-ico"><QrCode size={18} /></span>QR</span>
                  </div>
                </div>
              </div>

              {/* 3 */}
              <div className="scr scr-3">
                <div className="ps-head"><span><Wallet size={14} /> Confirm payment</span><X size={16} /></div>
                <div className="ps-payee"><span className="ps-av">A</span><div><b>Ada Studio</b><span className="mono">7xKX…9fQ2</span></div></div>
                <div className="ps-payamt"><TokenIcon kind="usdc" size={30} /><span>25.00</span><small>USDC</small></div>
                <div className="ps-row"><span>Network fee</span><span className="mono">under $0.01</span></div>
                <div className="ps-row"><span>Network</span><span className="mono">Solana</span></div>
                <div className="ps-row"><span>They receive</span><span className="mono">25.00 USDC</span></div>
                <div className="ps-face"><ScanFace size={30} strokeWidth={1.5} /></div>
                <div className="ps-track"><div className="ps-track-fill" /><div className="ps-knob"><ChevronsRight size={20} /></div><span className="ps-track-t">Slide to pay</span></div>
              </div>

              {/* 4 */}
              <div className="scr scr-4">
                <div className="ps-ring">
                  <svg viewBox="0 0 110 110"><circle className="ps-ring-bg" cx="55" cy="55" r="48" /><circle className="ps-ring-c" cx="55" cy="55" r="48" /><path className="ps-ring-k" d="M36 56 L50 70 L76 42" /></svg>
                  <div className="ps-sparks">{Array.from({ length: 12 }).map((_, i) => <i key={i} className="ps-spark" style={{ ["--a" as string]: `${i * 30}deg` }} />)}</div>
                </div>
                <div className="ps-got"><span className="ps-got-v">+0.00</span><small>USDC</small></div>
                <p className="ps-sub">Received from Manila · just now</p>
                <div className="ps-receipt">
                  <div><span>From</span><span className="mono">4Nd2…Qp7</span></div>
                  <div><span>Network</span><span className="mono">Solana</span></div>
                  <div><span>Status</span><span className="mono ps-ok"><Check size={12} strokeWidth={3} /> Settled</span></div>
                </div>
              </div>
            </div>
            <div className="phone-glare" />
          </div>
        </div>
      </div>
    </section>
  );
}
