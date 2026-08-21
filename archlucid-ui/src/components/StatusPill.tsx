import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
import { statusPillCombinedClass, type StatusPillDomain } from "@/lib/status-pill-domain-classes";

export type StatusPillProps = {
  status: string;
  domain?: StatusPillDomain;
  className?: string;
  /** When set, overrides the default `Status: {status}` screen-reader label. */
  ariaLabel?: string;
  /** Default true — small caps scan line for dense lists. */
  uppercase?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label">;

/**
 * @deprecated TB-2284 — use `StatusTag` (+ shared resolver in **TB-2285**) on all new surfaces.
 * Legacy wrapper around `status-pill-domain-classes`; migrate call sites under **TB-2286** / **TB-2287**.
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Metadata chip taxonomy*.
 */
export function StatusPill({
  status,
  domain = "general",
  className,
  ariaLabel,
  uppercase = true,
  ...rest
}: StatusPillProps) {
  const label = status.trim().length > 0 ? status : " — ";

  return (
    <MetadataStatusLabel
      className={cn(statusPillCombinedClass(label, domain), uppercase ? "uppercase" : null, className)}
      aria-label={ariaLabel ?? `Status: ${label}`}
      {...rest}
    >
      {label}
    </MetadataStatusLabel>
  );
}

export type { StatusPillDomain } from "@/lib/status-pill-domain-classes";
