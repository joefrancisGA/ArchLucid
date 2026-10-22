"use client";

import type { ReactNode } from "react";

import { HelpTooltipTrigger } from "@/components/ui/help-tooltip-trigger";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ToolbarHelpTooltipProps = {
  "aria-label": string;
  content: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  /** When set, wraps this element instead of rendering the default help icon button. */
  children?: ReactNode;
  "data-testid"?: string;
  "aria-keyshortcuts"?: string;
  onClick?: () => void;
};

/** Compact toolbar/header tooltip affordance with a recognizable help icon and 28px hit target. */
export function ToolbarHelpTooltip(props: ToolbarHelpTooltipProps): React.JSX.Element {
  const {
    content,
    className,
    side = "bottom",
    sideOffset = 6,
    children,
    onClick,
    "data-testid": dataTestId,
    "aria-keyshortcuts": ariaKeyShortcuts,
    "aria-label": ariaLabel,
  } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children != null ? (
          children
        ) : (
          <HelpTooltipTrigger
            aria-label={ariaLabel}
            size="toolbar"
            icon="help"
            className={className}
            data-testid={dataTestId}
            aria-keyshortcuts={ariaKeyShortcuts}
            onClick={onClick}
          />
        )}
      </TooltipTrigger>
      <TooltipContent sideOffset={sideOffset} side={side} className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
