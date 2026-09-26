"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { askNotify, notifyState } from "@/lib/notify";

/** Ask once for phone or desktop alerts. Hidden where the browser cannot show them. */
export default function AlertButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [st, setSt] = useState<ReturnType<typeof notifyState>>("unsupported");
  useEffect(() => { setSt(notifyState()); }, []);
  if (st === "unsupported") return null;
  const label = st === "granted" ? "Alerts on" : st === "denied" ? "Alerts blocked" : "Alert me when paid";
  return (
    <button
      type="button"
      className={`alert-btn is-${st} ${className}`}
      aria-label={label}
      title={st === "denied" ? "Allow notifications for this site in your browser settings" : label}
      onClick={async () => { if (st === "default") { await askNotify(); setSt(notifyState()); } }}
      disabled={st !== "default"}
    >
      {st === "granted" ? <BellRing size={16} /> : st === "denied" ? <BellOff size={16} /> : <Bell size={16} />}
      {!compact && <span>{label}</span>}
    </button>
  );
}
