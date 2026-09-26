/** QOVA mark: a coin shaped like a chat bubble, cut by the tail of a Q. */
export const MARK_D = "M38 35.81 L38 22 A16 16 0 1 0 22 38 L35.81 38 L26.165 28.357 A7.6 7.6 0 1 1 28.357 26.165 Z";

export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="4 4 40 40" aria-hidden="true" fill="currentColor">
      <path d={MARK_D} />
    </svg>
  );
}

export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="logo">
      <Mark size={size} className="logo-mark" />
      <span className="logo-word">QOVA</span>
    </span>
  );
}
