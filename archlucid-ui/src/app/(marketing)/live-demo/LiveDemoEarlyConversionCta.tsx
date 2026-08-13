import { Button } from "@/components/ui/button";
import { LIVE_DEMO_CTA_PRIMARY, LIVE_DEMO_EARLY_CONVERSION_PROMPT } from "@/lib/live-demo-page-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

/** Compact evaluation CTA after step 1 chrome — visible before finishing all steps (TB-1268). */
export function LiveDemoEarlyConversionCta() {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="live-demo-early-conversion"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.meta)}>
        {LIVE_DEMO_EARLY_CONVERSION_PROMPT}
      </p>
      <Button asChild variant="primary" size="sm" data-testid="live-demo-early-cta-evaluation">
        <LiveDemoTrackedLink href="/get-started" trackKind="conversion" trackValue="evaluation-early">
          {LIVE_DEMO_CTA_PRIMARY}
        </LiveDemoTrackedLink>
      </Button>
    </div>
  );
}
