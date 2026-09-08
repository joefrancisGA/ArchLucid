import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MouseEvent, ReactElement, ReactNode } from "react";

import { DESIGN_TOKENS } from "@/lib/design-tokens";

export type InteractiveChipProps = {
  readonly children: ReactNode;
  readonly href?: string;
  readonly scroll?: boolean;
  readonly onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly "aria-pressed"?: boolean | "true" | "false";
  readonly "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  readonly "aria-describedby"?: string;
  readonly "aria-disabled"?: boolean;
  readonly tabIndex?: number;
  readonly disabled?: boolean;
  readonly "data-testid"?: string;
};

/** Interactive filter/action chip shell — navigation or toggle affordance, not read-only metadata. */
export function InteractiveChip(props: InteractiveChipProps): ReactElement {
  const shell = cn(DESIGN_TOKENS.interactive.chip, DESIGN_TOKENS.accent.focusRing, props.className);

  if (props.href !== undefined && props.href.trim().length > 0) {
    return (
      <Link
        href={props.href}
        scroll={props.scroll}
        className={shell}
        onClick={props.onClick}
        aria-label={props["aria-label"]}
        aria-current={props["aria-current"]}
        aria-pressed={props["aria-pressed"]}
        aria-disabled={props["aria-disabled"]}
        tabIndex={props.tabIndex}
        data-testid={props["data-testid"]}
      >
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
      aria-pressed={props["aria-pressed"]}
      aria-describedby={props["aria-describedby"]}
      aria-disabled={props["aria-disabled"]}
      tabIndex={props.tabIndex}
      disabled={props.disabled}
      data-testid={props["data-testid"]}
    >
      {props.children}
    </button>
  );
}
