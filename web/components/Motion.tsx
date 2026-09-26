"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Page motion: smooth scroll, hero intro, split text reveals that play in and reverse out,
 * scrubbed lore text, parallax, nav hide on scroll, progress bar, magnetic buttons,
 * card tilt and the spotlight on the dark band. Everything is off for reduced motion.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { root.classList.add("reduce"); window.dispatchEvent(new Event("qova:motion")); return; }

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: { offset: -72 } });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const ctx = gsap.context(() => {
      // hero intro, waits for the loader
      const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      intro.from(".hero .hl-in", { yPercent: 118, rotate: 2, duration: 1.3, stagger: 0.1 }, 0.1);
      intro
        .to("[data-intro]", { opacity: 1, duration: 0.01 }, 0)
        .from(".hero .kicker", { y: 16, opacity: 0, duration: 0.8 }, 0)
        .from(".hero .lead", { y: 24, opacity: 0, filter: "blur(6px)", duration: 1 }, 0.35)
        .from(".hero .cta-row > *", { y: 20, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.45)
        .from(".hero .coin-stage", { scale: 0.55, rotate: -40, opacity: 0, duration: 1.6 }, 0.2)
        .from(".hero .orbit-field", { opacity: 0, scale: 0.8, duration: 1.4 }, 0.5)
        .from(".hero .chip", { y: 20, scale: 0.9, opacity: 0, duration: 0.9, stagger: 0.12, ease: "back.out(1.6)" }, 0.8);
      const go = () => intro.play();
      window.addEventListener("qova:ready", go, { once: true });
      if ((window as unknown as { __qovaReady?: boolean }).__qovaReady) go();

      // headings: words rise out of a mask, reverse when you scroll back above them
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "words,lines", mask: "lines", linesClass: "sl", autoSplit: true,
          onSplit: (s) => gsap.from(s.words, {
            yPercent: 110, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.045,
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          }),
        });
      });

      // blocks: fade up, disappear again when scrolled back past
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, {
          y: 40, opacity: 0, filter: "blur(8px)", duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
        gsap.from(el.children, {
          y: 34, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
        });
      });

      // lore: words light up as you scroll through
      gsap.utils.toArray<HTMLElement>("[data-scrub]").forEach((el) => {
        SplitText.create(el, {
          type: "words", autoSplit: true,
          onSplit: (s) => gsap.fromTo(s.words, { opacity: 0.12 }, {
            opacity: 1, ease: "none", stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
          }),
        });
      });

      // parallax
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const sp = parseFloat(el.dataset.speed || "0.2");
        gsap.to(el, { yPercent: -sp * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });

      // big footer word
      gsap.from(".foot-word", { yPercent: 40, opacity: 0, ease: "power2.out", scrollTrigger: { trigger: ".foot", start: "top 95%", end: "bottom bottom", scrub: true } });

      // progress bar and nav
      gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
      const nav = document.querySelector(".nav");
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          nav?.classList.toggle("nav-hidden", self.direction === 1 && self.scroll() > 240);
          nav?.classList.toggle("nav-solid", self.scroll() > 20);
        },
      });
    });

    // pointer toys (desktop only)
    const fine = window.matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];
    if (fine) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
        const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); };
        const leave = () => { xTo(0); yTo(0); };
        el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.setProperty("--tx", `${((py - 0.5) * -8).toFixed(2)}deg`);
          el.style.setProperty("--ty", `${((px - 0.5) * 10).toFixed(2)}deg`);
          el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
          el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        };
        const leave = () => { el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); };
        el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });
      document.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((el) => {
        const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`); };
        el.addEventListener("pointermove", move);
        cleanups.push(() => el.removeEventListener("pointermove", move));
      });
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.dispatchEvent(new Event("qova:motion"));

    return () => {
      cleanups.forEach((f) => f());
      window.removeEventListener("load", onLoad);
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
