"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { HelpTooltipTrigger } from "@/components/ui/help-tooltip-trigger";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { inlineHelpAriaLabel } from "@/lib/inline-help-aria-label";

export type FieldHelpTooltipProps = {
  /** Field, metric, or section name — used in the accessible name (`Help: {label}`) unless `ariaLabel` is set. */
  label: string;
  hint: ReactNode;
  /** Overrides the default `Help: {label}` accessible name when a fuller name is needed. */
  ariaLabel?: string;
  /** Optional class on the outer alignment wrapper. */
  className?: string;
  /** Optional class on the icon button trigger. */
  triggerClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
};

/** Inline help icon immediately after form labels, metric titles, or section headings. */
export function FieldHelpTooltip(props: FieldHelpTooltipProps): React.JSX.Element {
  const { label, hint, ariaLabel, className, triggerClassName, side = "top" } = props;
  const accessibleName = ariaLabel ?? inlineHelpAriaLabel(label);

  return (
    <span className={cn("inline-flex shrink-0 align-middle", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpTooltipTrigger
            aria-label={accessibleName}
            size="contextual"
            icon="info"
            className={triggerClassName}
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side={side} sideOffset={6}>
          {hint}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

/** @deprecated Prefer {@link FieldHelpTooltip} or {@link InlineHelp}; kept for existing imports. */
export const InlineHelpTooltip = FieldHelpTooltip;
