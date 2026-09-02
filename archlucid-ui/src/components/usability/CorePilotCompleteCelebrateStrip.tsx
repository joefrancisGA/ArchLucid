"use client";

import Link from "next/link";

import { useCompareFinalizedRunAvailability } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability";
import { Button } from "@/components/ui/button";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const CORE_PILOT_COMPLETE_COMPARE_AVAILABLE_BODY =
  "Explore analysis tools or share outcomes with your sponsor." as const;

const CORE_PILOT_COMPLETE_COMPARE_UNAVAILABLE_BODY =
  "Share outcomes with your sponsor. Finalize one more review to compare changes over time." as const;

const CORE_PILOT_COMPLETE_LOADING_BODY =
  "Share outcomes with your sponsor." as const;

/** Shown after Core Pilot completes — suggests analysis and sponsor handoff next steps. */
export function CorePilotCompleteCelebrateStrip(): React.JSX.Element | null {
  const { progress, isPending: pilotPending } = useCorePilotDerivedStepStatus();
  const { loading: compareLoading, insufficientForCompare } = useCompareFinalizedRunAvailability();

  if (pilotPending || !progress.allDone) {
    return null;
  }

  const showCompareAction = !compareLoading && !insufficientForCompare;
  const bodyCopy = compareLoading
    ? CORE_PILOT_COMPLETE_LOADING_BODY
    : showCompareAction
      ? CORE_PILOT_COMPLETE_COMPARE_AVAILABLE_BODY
      : CORE_PILOT_COMPLETE_COMPARE_UNAVAILABLE_BODY;

  return (
    <section
      aria-labelledby="core-pilot-complete-heading"
      className={OPERATOR_RESUME.stripCelebrate}
      data-testid="core-pilot-complete-celebrate-strip"
    >
      <h2
        id="core-pilot-complete-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        First review path complete
      </h2>
      <p
        className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="core-pilot-complete-body"
      >
        {bodyCopy}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {showCompareAction ? (
          <Button type="button" variant="outline" size="sm" asChild data-testid="core-pilot-complete-compare">
            <Link href={COMPARE_TWO_REVIEWS_PATH}>Compare reviews</Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" asChild data-testid="core-pilot-complete-sponsor-report">
          <Link href={SPONSOR_REPORT_PATH}>Open sponsor report</Link>
        </Button>
      </div>
    </section>
  );
}
