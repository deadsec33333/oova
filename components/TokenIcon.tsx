import { MARK_D } from "./Logo";

/** Glossy monochrome ticker coins. HTML text (not SVG text) so every browser renders them cleanly. Not official logos. */
export type TokenKind =
  | "usdc" | "sol" | "btc" | "eth" | "doge" | "bonk" | "wif" | "popcat" | "jup" | "qova"
  | "ngn" | "php" | "brl" | "kes" | "idr" | "pen" | "ars" | "ghs" | "mxn";

type Spec = { sym: string; tick?: string; v: "dark" | "light" | "chrome" | "color"; f?: number; c?: [string, string, string] };
// brand colours only (c1, c2, text); symbols are generic, not the projects' logos
const SPEC: Record<Exclude<TokenKind, "qova">, Spec> = {
  usdc: { sym: "$", tick: "USDC", v: "color", f: 0.42, c: ["#4C9BF0", "#2775CA", "#ffffff"] },
  sol: { sym: "◎", tick: "SOL", v: "color", f: 0.4, c: ["#9945FF", "#14F195", "#ffffff"] },
  btc: { sym: "₿", tick: "BTC", v: "color", f: 0.42, c: ["#FFAE45", "#F7931A", "#ffffff"] },
  eth: { sym: "Ξ", tick: "ETH", v: "color", f: 0.4, c: ["#8FA2F5", "#627EEA", "#ffffff"] },
  doge: { sym: "Ð", tick: "DOGE", v: "color", f: 0.4, c: ["#E1C65A", "#BA9F33", "#ffffff"] },
  bonk: { sym: "BONK", v: "color", f: 0.22, c: ["#FFC23D", "#F28C0F", "#2a1600"] },
  wif: { sym: "WIF", v: "color", f: 0.27, c: ["#F3C6A6", "#C98B62", "#2b1a10"] },
  popcat: { sym: "POP", tick: "CAT", v: "color", f: 0.24, c: ["#FFE7A3", "#F2B544", "#2a1d00"] },
  jup: { sym: "JUP", v: "color", f: 0.26, c: ["#C7F284", "#19BFD8", "#08241f"] },
  ngn: { sym: "₦", v: "light", f: 0.42 }, php: { sym: "₱", v: "light", f: 0.42 }, brl: { sym: "R$", v: "light", f: 0.32 },
  kes: { sym: "KSh", v: "light", f: 0.26 }, idr: { sym: "Rp", v: "light", f: 0.32 }, pen: { sym: "S/", v: "light", f: 0.32 },
  ars: { sym: "$", v: "light", f: 0.42 }, ghs: { sym: "₵", v: "light", f: 0.42 }, mxn: { sym: "$", v: "light", f: 0.42 },
};

/** Official artwork supplied by the owner for these tokens. */
const IMG: Partial<Record<TokenKind, string>> = {
  sol: "/tokens/sol.webp", doge: "/tokens/doge.webp", usdc: "/tokens/usdc.webp",
  wif: "/tokens/wif.webp", bonk: "/tokens/bonk.webp", btc: "/tokens/btc.webp", eth: "/tokens/eth.webp",
};

export default function TokenIcon({ kind, size = 40, className }: { kind: TokenKind; size?: number; className?: string }) {
  const cls = `tk${className ? ` ${className}` : ""}`;
  const img = IMG[kind];
  if (img) {
    return (
      <span className={`${cls} tk-img`} style={{ width: size, height: size }} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" width={size} height={size} loading="eager" decoding="async" draggable={false} />
      </span>
    );
  }
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
    <span
      className={`${cls} tk-${s.v}${withTick ? " tk-has-tick" : ""}`}
      style={{ width: size, height: size, fontSize: size * (s.f ?? 0.4), ...(s.c ? { ["--c1" as string]: s.c[0], ["--c2" as string]: s.c[1], ["--fg" as string]: s.c[2] } : {}) }}
      aria-hidden="true"
    >
      <b>{s.sym}</b>
      {withTick && <small style={{ fontSize: Math.max(7, size * 0.14) }}>{s.tick}</small>}
    </span>
  );
}
