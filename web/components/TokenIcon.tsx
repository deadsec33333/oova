import { MARK_D } from "./Logo";
/** Original monochrome token and currency badges (not official logos). */
export type TokenKind = "usdc" | "sol" | "ngn" | "php" | "brl" | "kes" | "idr" | "pen" | "ars" | "ghs" | "mxn" | "qova";

const LOCAL: Record<string, string> = { ngn: "₦", php: "₱", brl: "R$", kes: "KSh", idr: "Rp", pen: "S/", ars: "$", ghs: "₵", mxn: "$" };

export default function TokenIcon({ kind, size = 40, className }: { kind: TokenKind; size?: number; className?: string }) {
  const s = size;
  if (kind === "usdc") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19.5" fill="#0A0A0A" />
        <circle cx="20" cy="20" r="14" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.2" />
        <text x="20" y="26" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="17" fill="#fff">$</text>
      </svg>
    );
  }
  if (kind === "sol") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="#fff" stroke="#0A0A0A" strokeWidth="1.5" />
        <text x="20" y="24.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="11" fill="#0A0A0A">SOL</text>
      </svg>
    );
  }
  if (kind === "qova") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19.5" fill="#0A0A0A" />
        <g transform="translate(8.5 8.5) scale(0.64)"><path d={MARK_D} transform="translate(-4 -4)" fill="#fff" /></g>
      </svg>
    );
  }
  const sym = LOCAL[kind];
  return (
    <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#fff" stroke="#D4D4D4" strokeWidth="1" />
      <text x="20" y="25" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="600" fontSize={sym.length > 2 ? 10 : sym.length > 1 ? 13 : 16} fill="#0A0A0A">{sym}</text>
    </svg>
  );
}
