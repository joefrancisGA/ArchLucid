"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

import { HelpTooltipTrigger } from "@/components/ui/help-tooltip-trigger";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type FieldHelpTooltipProps = {
  /** Field or label name — used in the accessible name (`About {label}`) unless `ariaLabel` is set. */
  label: string;
  hint: ReactNode;
  /** Overrides the default `About {label}` accessible name when a fuller name is needed. */
  ariaLabel?: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

/** Inline help icon immediately after form labels or section titles. */
export function FieldHelpTooltip(props: FieldHelpTooltipProps): React.JSX.Element {
  const { label, hint, ariaLabel, className, side = "top" } = props;
  const accessibleName = ariaLabel ?? `About ${label}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpTooltipTrigger
          aria-label={accessibleName}
          size="contextual"
          icon="info"
          className={className}
        />
      </TooltipTrigger>
      <TooltipContent className={cn("max-w-xs", OPERATOR_TYPOGRAPHY.body)} side={side}>
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

/** @deprecated Prefer {@link FieldHelpTooltip}; kept for existing imports. */
export const InlineHelpTooltip = FieldHelpTooltip;
