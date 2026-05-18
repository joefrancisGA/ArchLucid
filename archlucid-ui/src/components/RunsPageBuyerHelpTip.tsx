"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type RunsPageBuyerHelpTipProps = {
  readonly variant: "search" | "sample-workspace";
};

/**
 * Compact info control so the reviews index body can stay one line wide with disclosure in a tooltip.
 */
export function RunsPageBuyerHelpTip(props: RunsPageBuyerHelpTipProps) {
  const { variant } = props;

  const label =
    variant === "search"
      ? "How to use Search reviews on this page"
      : "About this example workspace listing";

  const body =
    variant === "search" ? (
      <>
        Use <strong className="font-medium text-neutral-900 dark:text-neutral-100">Search reviews</strong> below to narrow
        by title or description. Each row opens the full review package — manifest, evidence trail, findings, and
        deliverables — for that run.
      </>
    ) : (
      <>
        Illustrative sample workspace only — suitable for understanding output shape and navigation, not as
        customer-specific ROI or compliance evidence.
      </>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ms-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
            aria-label={label}
          >
            <Info className="h-4 w-4" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left text-sm">
          {body}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
