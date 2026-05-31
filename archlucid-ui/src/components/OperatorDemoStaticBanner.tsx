import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { BUYER_EXAMPLE_WORKSPACE_TOOLTIP } from "@/lib/buyer-polish-copy";

/**
 * Inline notice when operator run/manifest content is served from the curated showcase bundle
 * because the upstream API returned an error and static demo fallback is enabled (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`).
 */
export function OperatorDemoStaticBanner(): ReactElement {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!demoMode) {
    return (
      <div
        className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-2.5 py-1 text-xs leading-snug"
        role="status"
        data-demo-static="true"
      >
        <span className="font-medium">Demonstration workspace</span>
        <span className="text-amber-900/95 dark:text-amber-200/95">
          {" — "}Review package aligned with the Claims Intake workspace; connect a tenant for live data.
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-2.5 py-1 text-xs leading-snug"
            role="status"
            data-demo-static="true"
          >
            <span className="font-medium">Demonstration workspace</span>
            <span className="sr-only"> — {BUYER_EXAMPLE_WORKSPACE_TOOLTIP}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{BUYER_EXAMPLE_WORKSPACE_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
