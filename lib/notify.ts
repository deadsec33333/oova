"use client";
/** Phone and desktop alerts. Only after the person taps to allow them. */
export const notifySupported = () => typeof window !== "undefined" && "Notification" in window;
export const notifyState = (): "unsupported" | "default" | "granted" | "denied" =>
  notifySupported() ? Notification.permission : "unsupported";

export async function askNotify(): Promise<boolean> {
  if (!notifySupported()) return false;
  try { return (await Notification.requestPermission()) === "granted"; } catch { return false; }
}

export async function systemNotify(title: string, body: string, url = "/app") {
  if (notifyState() !== "granted") return;
  const opts = { body, icon: "/icon.svg", badge: "/icon.svg", tag: `qova-${Date.now()}`, data: { url } };
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch { /* fall through */ }
  try { const n = new Notification(title, opts); n.onclick = () => { window.focus(); n.close(); }; } catch { /* ignore */ }
}
