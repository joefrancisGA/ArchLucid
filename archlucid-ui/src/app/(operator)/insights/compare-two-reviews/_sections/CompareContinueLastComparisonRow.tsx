"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import type { CompareLastComparisonPair } from "@/lib/compare/compare-last-comparison-pair-storage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareContinueLastComparisonRowProps = {
  readonly pair: CompareLastComparisonPair;
};

/** Pinned continue row for the most recently compared review pair. */
export function CompareContinueLastComparisonRow(
  props: CompareContinueLastComparisonRowProps,
): React.JSX.Element {
  const href = comparePageHrefAdaptive(props.pair.priorRunId, props.pair.laterRunId);

  return (
    <section
      aria-labelledby="compare-continue-last-comparison-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="compare-continue-last-comparison-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="compare-continue-last-comparison-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last comparison
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Resume comparing your last baseline and updated review pair.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="compare-continue-last-comparison-open">
          <Link href={href}>Resume comparison</Link>
        </Button>
      </div>
    </section>
  );
}
