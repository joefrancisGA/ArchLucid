"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type InlineInfoTooltipProps = {
  /** Field or label name — used in the accessible name (`About {label}`). */
  label: string;
  hint: string;
  className?: string;
};

/** Inline `i` icon for short label explanations — not for opening documentation pages. */
export function InlineInfoTooltip(props: InlineInfoTooltipProps): React.JSX.Element {
  const { label, hint, className } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-400/80 bg-white text-neutral-600 hover:border-teal-600 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2 dark:border-neutral-500 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-teal-500 dark:hover:text-teal-200",
            className,
          )}
          aria-label={`About ${label}`}
        >
          <Info className="h-3 w-3" aria-hidden strokeWidth={2.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
