"use client";
import { useEffect, useState } from "react";

/** Rotating last word of the headline. Screen readers get the first word only. */
export default function WordRotator({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className="rotator" aria-label={words[0]}>
      {words.map((w, n) => (
        <span key={w} aria-hidden="true" className={n === i ? "rot-word is-in" : n === (i - 1 + words.length) % words.length ? "rot-word is-out" : "rot-word"}>{w}</span>
      ))}
      <span className="rot-sizer" aria-hidden="true">{words.reduce((a, b) => (b.length > a.length ? b : a))}</span>
    </span>
  );
}
