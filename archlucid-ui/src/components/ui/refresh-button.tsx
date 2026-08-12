"use client";

import { RefreshCw } from "lucide-react";
import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Canonical visible label for a control that re-reads current data (GET) without mutating it. */
export const REFRESH_BUTTON_LABEL = "Refresh";

/**
 * `aria-label` and `title` are deliberately not accepted. An `aria-label` would replace the
 * accessible name and drop the visible word "Refresh" from it, breaking WCAG 2.5.3 (Label in
 * Name) and voice control. A `title` tooltip is barred by the TB-2378 ratchet, since this
 * button is disabled while busy and a disabled control is neither focusable nor hoverable on
 * touch. Surfaces needing extra context render a visible assist line next to the button.
 */
export type RefreshButtonProps = Omit<
  ButtonProps,
  "children" | "asChild" | "aria-label" | "title"
> & {
  /** True while the underlying read is in flight; spins the icon and disables the control. */
  readonly busy?: boolean;
  /**
   * Overrides the visible label for surfaces that refresh a named subset
   * (for example "Refresh preview"). Prefer the default elsewhere.
   */
  readonly label?: string;
};

/**
 * Canonical refresh control: icon plus the word, per the enterprise design standard.
 *
 * The label stays static while busy and the icon spins instead. Swapping the text to
 * "Refreshing…" changes the button's width mid-click, which shifts every sibling in a
 * header action cluster; `aria-busy` carries the state for assistive tech instead.
 */
export function RefreshButton({
  busy = false,
  label = REFRESH_BUTTON_LABEL,
  variant = "outline",
  size = "sm",
  className,
  disabled,
  ...buttonProps
}: RefreshButtonProps): React.JSX.Element {
  return (
    <Button
      {...buttonProps}
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled === true || busy}
      aria-busy={busy}
    >
      <RefreshCw className={cn("size-3.5 shrink-0", busy && "animate-spin")} aria-hidden />
      {label}
    </Button>
  );
}
