"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Shown after Core Pilot completes — suggests analysis and sponsor handoff next steps. */
export function CorePilotCompleteCelebrateStrip(): React.JSX.Element | null {
  const { progress, isPending } = useCorePilotDerivedStepStatus();

  if (isPending || !progress.allDone) {
    return null;
  }

  return (
    <section
      aria-labelledby="core-pilot-complete-heading"
      className="mb-3 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/20"
      data-testid="core-pilot-complete-celebrate-strip"
    >
      <h2
        id="core-pilot-complete-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        First review path complete
      </h2>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        Explore analysis tools or share outcomes with your sponsor.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={COMPARE_TWO_REVIEWS_PATH}>Compare reviews</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={SPONSOR_REPORT_PATH}>Open sponsor report</Link>
        </Button>
      </div>
    </section>
  );
}
