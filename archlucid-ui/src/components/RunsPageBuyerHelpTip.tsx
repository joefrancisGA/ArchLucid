"use client";

import { CircleHelp } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type RunsPageBuyerHelpTipProps = {
  readonly variant: "search" | "sample-workspace";
};

/**
 * Compact help control so the reviews index body can stay one line wide with disclosure in a tooltip.
 */
export function RunsPageBuyerHelpTip(props: RunsPageBuyerHelpTipProps) {
  const { variant } = props;

  const label =
    variant === "search"
      ? "How to use Search review packages on this page"
      : "About this demonstration workspace";

  const body =
    variant === "search" ? (
      <>
        Use <strong className="font-medium text-neutral-900 dark:text-neutral-100">Search review packages</strong> below to narrow
        by title or description. Each row opens the full review package — manifest, evidence trail, findings, and
        deliverables — for that run.
      </>
    ) : (
      <>
        Demonstration workspace — suitable for understanding output shape and navigation, not as customer-specific ROI or
        compliance evidence.
      </>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ms-1 inline-flex shrink-0 rounded p-0.5 text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:ring-2 dark:text-neutral-400 dark:hover:text-neutral-200"
            aria-label={label}
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left text-sm">
          {body}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
