/** Original token and currency badges (not official logos). */
export type TokenKind = "usdc" | "sol" | "ngn" | "php" | "brl" | "kes" | "idr" | "pen" | "ars" | "ghs" | "mxn" | "qova";

const LOCAL: Record<string, { sym: string; bg: string; fg: string }> = {
  ngn: { sym: "₦", bg: "#E8F5EC", fg: "#137a3c" },
  php: { sym: "₱", bg: "#E9EEFB", fg: "#2448a8" },
  brl: { sym: "R$", bg: "#FFF6D9", fg: "#8a6a00" },
  kes: { sym: "KSh", bg: "#FDE9E7", fg: "#a3261b" },
  idr: { sym: "Rp", bg: "#FCE8EC", fg: "#a1203c" },
  pen: { sym: "S/", bg: "#FDECEC", fg: "#b0282b" },
  ars: { sym: "$", bg: "#E6F4FB", fg: "#1f6f97" },
  ghs: { sym: "₵", bg: "#FFF3DC", fg: "#8d5b00" },
  mxn: { sym: "$", bg: "#E7F5EE", fg: "#1e7a4c" },
};

export default function TokenIcon({ kind, size = 40, className }: { kind: TokenKind; size?: number; className?: string }) {
  const s = size;
  if (kind === "usdc") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="tku" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B8BE8" /><stop offset="1" stopColor="#1F5FB8" /></linearGradient></defs>
        <circle cx="20" cy="20" r="19" fill="url(#tku)" />
        <circle cx="20" cy="20" r="13.5" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
        <text x="20" y="26" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="17" fill="#fff">$</text>
      </svg>
    );
  }
  if (kind === "sol") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="tks" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#9B5CFF" /><stop offset="1" stopColor="#19E3A1" /></linearGradient></defs>
        <circle cx="20" cy="20" r="19" fill="#0B0F17" />
        <circle cx="20" cy="20" r="18.4" fill="none" stroke="url(#tks)" strokeWidth="1.2" />
        <text x="20" y="24.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="11" fill="url(#tks)">SOL</text>
      </svg>
    );
  }
  if (kind === "qova") {
    return (
      <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="tkq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#b9c1ca" /><stop offset="1" stopColor="#6d7682" /></linearGradient></defs>
        <circle cx="20" cy="20" r="19" fill="#070B14" />
        <circle cx="19" cy="19" r="9" fill="none" stroke="url(#tkq)" strokeWidth="4" />
        <path d="M24 24 L30 30" stroke="#19C39B" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  const c = LOCAL[kind];
  return (
    <svg className={className} width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill={c.bg} stroke="#fff" strokeWidth="1" />
      <text x="20" y="25" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="600" fontSize={c.sym.length > 2 ? 10 : c.sym.length > 1 ? 13 : 16} fill={c.fg}>{c.sym}</text>
    </svg>
  );
}
