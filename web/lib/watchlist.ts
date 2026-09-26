"use client";
/** Links made without signing in, kept on this device so we can still watch them after a reload. */
export type Watched = { to: string; amount: string; ref: string; label?: string; message?: string; createdAt: number };
const KEY = "qova-watch", DONE = "qova-notified", WEEK = 7 * 86400_000;

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export const watched = (): Watched[] => read<Watched[]>(KEY, []).filter((w) => Date.now() - w.createdAt < WEEK);
export function watch(w: Watched) { write(KEY, [w, ...watched().filter((x) => x.ref !== w.ref)].slice(0, 20)); }
export function unwatch(ref: string) { write(KEY, watched().filter((x) => x.ref !== ref)); }

/** True the first time a payment is seen on this device, so each one alerts once. */
export function firstSeen(ref: string): boolean {
  const s = read<string[]>(DONE, []);
  if (s.includes(ref)) return false;
  write(DONE, [ref, ...s].slice(0, 200));
  return true;
}
