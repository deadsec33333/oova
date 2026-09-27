"use client";
import { useEffect, useRef, useState } from "react";
import { armSound, sound, soundPref } from "@/lib/sound";

const BARS = 5;

/** Floating sound switch: a tiny live equalizer driven by the real audio output. */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  // remember the choice across pages and visits
  useEffect(() => {
    if (!soundPref()) return;
    setOn(true);
    return armSound();
  }, []);

  // wire UI sounds once
  useEffect(() => {
    const s = sound();
    const isBtn = (el: Element | null) => el?.closest(".b, .btn, .nav-links a, .burger, .theme-btn, .faq summary, .menu-links a, .card");
    const over = (e: PointerEvent) => { if (e.pointerType === "mouse" && isBtn(e.target as Element) && !(e.relatedTarget instanceof Node && isBtn(e.target as Element)?.contains(e.relatedTarget))) s.play("tick"); };
    const down = (e: PointerEvent) => { if (isBtn(e.target as Element) && !(e.target as Element).closest(".sound-btn")) s.play("tap"); };
    const made = () => s.play("chime");
    const theme = () => s.play("swoosh");
    const step = (e: Event) => { const i = (e as CustomEvent<number>).detail; s.play(i === 3 ? "ping" : "whoosh"); };
    const key = () => s.play("key");
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);
    window.addEventListener("qova:made", made);
    window.addEventListener("qova:theme", theme);
    window.addEventListener("qova:step", step);
    window.addEventListener("qova:key", key);
    return () => {
      window.removeEventListener("pointerover", over); window.removeEventListener("pointerdown", down);
      window.removeEventListener("qova:made", made); window.removeEventListener("qova:theme", theme);
      window.removeEventListener("qova:step", step); window.removeEventListener("qova:key", key);
    };
  }, []);

  // equalizer loop
  useEffect(() => {
    if (!on) { bars.current.forEach((b) => b && (b.style.transform = "scaleY(0.12)")); return; }
    const data = new Uint8Array(32);
    let raf = 0, t = 0;
    const loop = () => {
      t += 0.05;
      sound().levels(data);
      bars.current.forEach((b, i) => {
        if (!b) return;
        const v = data[2 + i * 3] / 255;
        const idle = 0.22 + 0.12 * Math.sin(t * 1.3 + i * 1.1);
        b.style.transform = `scaleY(${Math.min(1, Math.max(idle, v * 1.6)).toFixed(3)})`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  const toggle = async () => {
    const s = sound();
    if (on) { s.disable(); setOn(false); }
    else { try { await s.enable(); setOn(true); } catch { setOn(false); } }
  };

  return (
    <button type="button" className={`sound-btn${on ? " is-on" : ""}`} onClick={toggle} aria-pressed={on} aria-label={on ? "Turn sound off" : "Turn sound on"}>
      <span className="eq" aria-hidden="true">
        {Array.from({ length: BARS }).map((_, i) => <span key={i} ref={(el) => { bars.current[i] = el; }} />)}
      </span>
      <span className="sound-label mono"><span>{on ? "Sound on" : "Sound off"}</span></span>
    </button>
  );
}
