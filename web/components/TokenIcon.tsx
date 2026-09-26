import { MARK_D } from "./Logo";

/** Glossy monochrome ticker coins. HTML text (not SVG text) so every browser renders them cleanly. Not official logos. */
export type TokenKind =
  | "usdc" | "sol" | "btc" | "eth" | "doge" | "bonk" | "wif" | "popcat" | "jup" | "qova"
  | "ngn" | "php" | "brl" | "kes" | "idr" | "pen" | "ars" | "ghs" | "mxn";

type Spec = { sym: string; tick?: string; v: "dark" | "light" | "chrome"; f?: number };
const SPEC: Record<Exclude<TokenKind, "qova">, Spec> = {
  usdc: { sym: "$", tick: "USDC", v: "dark", f: 0.42 },
  sol: { sym: "◎", tick: "SOL", v: "light", f: 0.4 },
  btc: { sym: "₿", tick: "BTC", v: "chrome", f: 0.42 },
  eth: { sym: "Ξ", tick: "ETH", v: "light", f: 0.4 },
  doge: { sym: "Ð", tick: "DOGE", v: "chrome", f: 0.4 },
  bonk: { sym: "BONK", v: "dark", f: 0.22 },
  wif: { sym: "WIF", v: "chrome", f: 0.27 },
  popcat: { sym: "POP", tick: "CAT", v: "light", f: 0.24 },
  jup: { sym: "JUP", v: "dark", f: 0.26 },
  ngn: { sym: "₦", v: "light", f: 0.42 }, php: { sym: "₱", v: "light", f: 0.42 }, brl: { sym: "R$", v: "light", f: 0.32 },
  kes: { sym: "KSh", v: "light", f: 0.26 }, idr: { sym: "Rp", v: "light", f: 0.32 }, pen: { sym: "S/", v: "light", f: 0.32 },
  ars: { sym: "$", v: "light", f: 0.42 }, ghs: { sym: "₵", v: "light", f: 0.42 }, mxn: { sym: "$", v: "light", f: 0.42 },
};

export default function TokenIcon({ kind, size = 40, className }: { kind: TokenKind; size?: number; className?: string }) {
  const cls = `tk${className ? ` ${className}` : ""}`;
  if (kind === "qova") {
    return (
      <span className={`${cls} tk-dark`} style={{ width: size, height: size }} aria-hidden="true">
        <svg viewBox="4 4 40 40" width={size * 0.56} height={size * 0.56} fill="#fff"><path d={MARK_D} /></svg>
      </span>
    );
  }
  const s = SPEC[kind];
  const withTick = !!s.tick && size >= 44;
  return (
    <span className={`${cls} tk-${s.v}${withTick ? " tk-has-tick" : ""}`} style={{ width: size, height: size, fontSize: size * (s.f ?? 0.4) }} aria-hidden="true">
      <b>{s.sym}</b>
      {withTick && <small style={{ fontSize: Math.max(7, size * 0.14) }}>{s.tick}</small>}
    </span>
  );
}
