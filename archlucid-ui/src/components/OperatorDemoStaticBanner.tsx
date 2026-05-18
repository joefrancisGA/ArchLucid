import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const EXAMPLE_SAMPLE_TOOLTIP = "Example workspace using illustrative sample data only.";

/**
 * Inline notice when operator run/manifest content is served from the curated showcase bundle
 * because the upstream API returned an error and static demo fallback is enabled (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`).
 */
export function OperatorDemoStaticBanner(): ReactElement {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!demoMode) {
    return (
      <div
        className="rounded-md border border-amber-200/85 bg-amber-50/80 px-2.5 py-1 text-xs leading-snug text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        role="status"
        data-demo-static="true"
      >
        <span className="font-medium">Demonstration content</span>
        <span className="text-amber-900/95 dark:text-amber-200/95">
          {" — "}Example review aligned with the showcase; connect a workspace for live data.
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="rounded-md border border-teal-200/80 bg-teal-50/60 px-2.5 py-1 text-xs leading-snug text-teal-950 dark:border-teal-900/55 dark:bg-teal-950/30 dark:text-teal-50"
            role="status"
            data-demo-static="true"
          >
            <span className="font-medium">Example workspace</span>
            <span className="sr-only"> — Example workspace using illustrative sample data only.</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{EXAMPLE_SAMPLE_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
