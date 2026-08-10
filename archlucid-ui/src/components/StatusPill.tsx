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
 * Unified status metadata label: shared semantic palette (pipeline, governance, health, general).
 * Does not alter stored API status strings — only presentation.
 */
export function StatusPill({
  status,
  domain = "general",
  className,
  ariaLabel,
  uppercase = true,
  ...rest
}: StatusPillProps) {
  const label = status.trim().length > 0 ? status : "—";

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
