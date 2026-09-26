"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Link as LinkIcon, MessageCircle, Send, Share2, Wallet } from "lucide-react";
import TokenIcon from "./TokenIcon";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { k: "01", t: "Type the amount", d: "Your address and 25.00 USDC. That is the whole form." },
  { k: "02", t: "Share the link", d: "WhatsApp, Telegram, email, a QR on the counter. Anywhere." },
  { k: "03", t: "They pay from any wallet", d: "One tap in Phantom, Solflare or Backpack. No sign up." },
  { k: "04", t: "Dollars arrive", d: "The exact amount lands in your wallet, usually within seconds." },
];

/** A payment played on a phone, driven by scroll. Sample data. */
export default function Story() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = Array.from(root.querySelectorAll<HTMLElement>(".st-step"));
    const setStep = (i: number) => steps.forEach((s, n) => s.classList.toggle("is-on", n === i));
    setStep(0);
    if (reduce) { root.classList.add("story-static"); return; }

    const amt = root.querySelector<HTMLElement>(".ps-amount-v");
    const got = root.querySelector<HTMLElement>(".ps-got-v");
    const counter = { a: 0, g: 0 };
    const fmt = (n: number) => n.toFixed(2);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ desk: "(min-width: 900px)", mob: "(max-width: 899px)" }, (c) => {
        const desk = c.conditions?.desk;
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: root, start: "top top", end: desk ? "+=2600" : "+=2000", pin: true, scrub: 0.6, anticipatePin: 1,
          },
        });
        // 1: type the amount
        tl.fromTo(counter, { a: 0 }, { a: 25, duration: 1, ease: "none", onUpdate: () => { if (amt) amt.textContent = fmt(counter.a); } })
          .from(".ps-addr-fill", { clipPath: "inset(0 100% 0 0)", duration: 0.8, ease: "none" }, 0.2)
          .to(".ps-btn", { scale: 0.94, duration: 0.15, yoyo: true, repeat: 1 }, 1.1)
          .to(".st-q", { rotateY: 360, duration: 0.8 }, 1.1)
        // 2: share
          .to(".scr-1", { yPercent: -8, opacity: 0, duration: 0.4 }, 1.5)
          .fromTo(".scr-2", { yPercent: 10, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5 }, 1.6)
          .from(".ps-share > *", { y: 16, opacity: 0, stagger: 0.08, duration: 0.4 }, 1.9)
          .from(".ps-bubble", { x: 40, opacity: 0, scale: 0.9, duration: 0.6, ease: "back.out(1.5)" }, 2.2)
          .to(".st-tail", { scaleX: 1, duration: 0.7 }, 2.2)
        // 3: pay
          .to(".scr-2", { yPercent: -8, opacity: 0, duration: 0.4 }, 3.1)
          .fromTo(".scr-3", { yPercent: 10, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5 }, 3.2)
          .to(".ps-knob", { x: () => { const t = root.querySelector<HTMLElement>(".ps-track"); const k = root.querySelector<HTMLElement>(".ps-knob"); return t && k ? t.clientWidth - k.clientWidth - 8 : 180; }, duration: 0.9, ease: "power1.inOut" }, 3.6)
          .to(".ps-track-fill", { scaleX: 1, duration: 0.9, ease: "power1.inOut" }, 3.6)
        // 4: arrive
          .to(".scr-3", { yPercent: -8, opacity: 0, duration: 0.4 }, 4.7)
          .fromTo(".scr-4", { yPercent: 10, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5 }, 4.8)
          .from(".ps-ring", { scale: 0.3, opacity: 0, duration: 0.6, ease: "back.out(2)" }, 4.9)
          .fromTo(counter, { g: 0 }, { g: 25, duration: 0.8, ease: "power2.out", onUpdate: () => { if (got) got.textContent = `+${fmt(counter.g)}`; } }, 5.0)
          .from(".ps-spark", { scale: 0, opacity: 0, stagger: 0.03, duration: 0.6, ease: "expo.out" }, 5.0)
          .to(".st-glow", { opacity: 1, duration: 0.6 }, 5.0)
          .to({}, { duration: 0.6 });
        tl.eventCallback("onUpdate", () => { const t = tl.time(); setStep(t < 1.5 ? 0 : t < 3.1 ? 1 : t < 4.7 ? 2 : 3); });
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
          <h2 className="h2">Watch a payment happen.</h2>
          <ol className="st-steps">
            {STEPS.map((s) => (
              <li key={s.k} className="st-step">
                <span className="mono st-k">{s.k}</span>
                <div><b>{s.t}</b><p>{s.d}</p></div>
              </li>
            ))}
          </ol>
          <p className="fine mono st-note">Animation with sample data</p>
        </div>

        <div className="st-stage">
          <div className="st-glow" aria-hidden="true" />
          <div className="phone" aria-hidden="true">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="ps-top"><span className="ps-brand"><span className="brand-mark" /> QOVA</span><span className="mono ps-time">9:41</span></div>

              <div className="scr scr-1">
                <span className="mono ps-lbl">Receive</span>
                <div className="ps-amount"><TokenIcon kind="usdc" size={28} /><span className="ps-amount-v">0.00</span><small>USDC</small></div>
                <span className="mono ps-lbl">To</span>
                <div className="ps-addr"><span className="ps-addr-fill mono">7xKX…9fQ2 · Ada Studio</span></div>
                <div className="ps-btn"><LinkIcon size={16} /> Make my pay link</div>
                <div className="st-coinwrap"><div className="st-q"><TokenIcon kind="qova" size={56} /></div><div className="st-tail" /></div>
              </div>

              <div className="scr scr-2">
                <span className="mono ps-lbl ps-mint">Link ready</span>
                <div className="ps-linkcard"><span className="mono">qova/pay?amount=25.00</span><Share2 size={16} /></div>
                <div className="ps-share">
                  <span><MessageCircle size={18} />Chat</span><span><Send size={18} />Telegram</span><span><Share2 size={18} />More</span>
                </div>
                <div className="ps-chat">
                  <div className="ps-bubble"><b>Pay me 25.00 USDC</b><span className="mono">qova/pay?amount=25.00</span></div>
                </div>
              </div>

              <div className="scr scr-3">
                <span className="mono ps-lbl"><Wallet size={14} /> Any Solana wallet</span>
                <div className="ps-payamt">25.00 <small>USDC</small></div>
                <p className="ps-to">to <b>Ada Studio</b></p>
                <div className="ps-row"><span>Network fee</span><span className="mono">under $0.01</span></div>
                <div className="ps-row"><span>Paid by</span><span className="mono">sender</span></div>
                <div className="ps-track"><div className="ps-track-fill" /><div className="ps-knob"><Check size={18} /></div><span className="ps-track-t">Slide to pay</span></div>
              </div>

              <div className="scr scr-4">
                <div className="ps-ring"><Check size={40} strokeWidth={2.5} /></div>
                <div className="ps-got"><span className="ps-got-v">+0.00</span> <small>USDC</small></div>
                <p className="ps-to">Received from Manila</p>
                <div className="ps-sparks">{Array.from({ length: 10 }).map((_, i) => <i key={i} className="ps-spark" style={{ ["--a" as string]: `${i * 36}deg` }} />)}</div>
                <span className="mono ps-lbl ps-mint">Wallet to wallet · no middleman</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
