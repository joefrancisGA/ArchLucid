import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { DESIGN_TOKENS } from "@/lib/design-tokens";

export type FilterChipProps = {
  readonly children: ReactNode;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly disabled?: boolean;
};

/**
 * Interactive filter/action chip — hover and focus affordance.
 * Do not use for read-only status; use StatusTag, SeverityTag, or StatusPill instead.
 */
export function FilterChip(props: FilterChipProps): ReactElement {
  const shell = cn(DESIGN_TOKENS.interactive.chip, DESIGN_TOKENS.accent.focusRing, props.className);

  if (props.href !== undefined && props.href.trim().length > 0) {
    return (
      <Link href={props.href} className={shell} aria-label={props["aria-label"]}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={shell}
      onClick={props.onClick}
      aria-label={props["aria-label"]}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
