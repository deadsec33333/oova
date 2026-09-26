import { ArrowUpRight } from "lucide-react";

/** Premium button: rolling label on hover and an arrow chip that slides. Works as a link. */
export default function Btn({ href, children, variant = "primary", size = "md", arrow = true, magnetic = true, className = "", target }: {
  href: string; children: string; variant?: "primary" | "light" | "outline" | "ghost"; size?: "sm" | "md" | "lg"; arrow?: boolean; magnetic?: boolean; className?: string; target?: string;
}) {
  return (
    <a href={href} target={target} rel={target ? "noopener" : undefined} className={`b b-${variant} b-${size} ${className}`} {...(magnetic ? { "data-magnetic": "" } : {})}>
      <span className="b-label" data-text={children}><span>{children}</span></span>
      {arrow && (
        <span className="b-chip" aria-hidden="true">
          <ArrowUpRight className="b-ar b-ar1" size={16} strokeWidth={2.2} />
          <ArrowUpRight className="b-ar b-ar2" size={16} strokeWidth={2.2} />
        </span>
      )}
    </a>
  );
}
