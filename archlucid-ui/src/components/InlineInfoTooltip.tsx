"use client";

import { CircleHelp } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type InlineInfoTooltipProps = {
  /** Field or label name — used in the accessible name (`About {label}`). */
  label: string;
  hint: string;
  className?: string;
};

/** Inline help icon for short label explanations — not for opening documentation pages. */
export function InlineInfoTooltip(props: InlineInfoTooltipProps): React.JSX.Element {
  const { label, hint, className } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 rounded p-0.5 text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:ring-2 dark:text-neutral-400 dark:hover:text-neutral-200",
            className,
          )}
          aria-label={`About ${label}`}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
