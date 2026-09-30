"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { armSound, sound, soundPref } from "@/lib/sound";

/** Sound on or off. Shares the saved choice with the landing page. */
export default function SoundSwitch({ className = "ax-ibtn ax-ibtn-lg" }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(soundPref());
    const stop = armSound();
    const sync = () => setOn(soundPref());
    window.addEventListener("qova:sound", sync);
    return () => { stop(); window.removeEventListener("qova:sound", sync); };
  }, []);
  const toggle = async () => {
    const s = sound();
    if (on) { s.disable(); setOn(false); }
    else { try { await s.enable(); setOn(true); } catch { setOn(false); } }
    window.dispatchEvent(new Event("qova:sound"));
  };
  return (
    <button type="button" className={`${className}${on ? " is-on" : ""}`} onClick={toggle} aria-pressed={on} aria-label={on ? "Sound on. Turn off" : "Sound off. Turn on"} title={on ? "Sound on" : "Sound off"}>
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}
