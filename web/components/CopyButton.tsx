"use client";
import { useState } from "react";

export default function CopyButton({ text, label = "Copy", className = "btn btn-outline" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* ignore */ }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
