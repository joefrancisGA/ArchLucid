"use client";

import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Canonical visible label for in-place dismiss actions. */
export const DISMISS_CONTROL_LABEL = "Dismiss";

export type DismissControlProps = {
  readonly onDismiss: () => void;
  /** Visible label when `iconOnly` is false. Defaults to {@link DISMISS_CONTROL_LABEL}. */
  readonly label?: string;
  /** Icon-only control; requires `ariaLabel`. */
  readonly iconOnly?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly "data-testid"?: string;
  readonly size?: ComponentProps<typeof Button>["size"];
  /**
   * Visual weight for text dismiss. Defaults to `outline` so the control has a visible boundary.
   */
  readonly variant?: "outline";
  readonly disabled?: boolean;
};

/** Low-priority button for in-place banner, hint, and callout dismissal — never a link. */
export function DismissControl(props: DismissControlProps): React.JSX.Element {
  const label = props.label ?? DISMISS_CONTROL_LABEL;
  const variant = props.variant ?? "outline";

  if (props.iconOnly) {
    if (props.ariaLabel === undefined || props.ariaLabel.trim().length === 0) {
      throw new Error("DismissControl iconOnly requires ariaLabel.");
    }

    return (
      <Button
        type="button"
        variant={variant}
        size={props.size ?? "icon"}
        className={cn("h-8 w-8 shrink-0", props.className)}
        aria-label={props.ariaLabel}
        data-testid={props["data-testid"]}
        disabled={props.disabled}
        onClick={props.onDismiss}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={props.size ?? "sm"}
      className={cn("h-7 shrink-0", props.className)}
      data-testid={props["data-testid"]}
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      onClick={props.onDismiss}
    >
      {label}
    </Button>
  );
}
