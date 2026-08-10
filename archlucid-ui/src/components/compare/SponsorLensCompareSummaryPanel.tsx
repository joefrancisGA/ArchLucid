import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import {
  buildSponsorLensCompareSummary,
  SPONSOR_LENS_COMPARE_DISCLAIMER,
  SPONSOR_LENS_COMPARE_HEADING,
} from "@/lib/build-sponsor-lens-compare-summary";
import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import type { CompareGovernanceDiffView } from "@/lib/compare-effective-governance-diff";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GoldenManifestComparison } from "@/types/comparison";

export type SponsorLensCompareSummaryPanelProps = {
  readonly golden: GoldenManifestComparison | null;
  readonly executionModeHonesty: CompareExecutionModeHonesty | null;
  readonly governanceDiff: CompareGovernanceDiffView | null;
};

/** TB-2178: sponsor-comprehensible compare notice above technical deltas. */
export function SponsorLensCompareSummaryPanel(props: SponsorLensCompareSummaryPanelProps): ReactElement | null {
  const summary = buildSponsorLensCompareSummary({
    golden: props.golden,
    executionModeHonesty: props.executionModeHonesty,
    governanceDiff: props.governanceDiff,
  });

  if (summary.insufficientData) {
    return (
      <section
        className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
        aria-label={SPONSOR_LENS_COMPARE_HEADING}
        data-testid="sponsor-lens-compare-summary"
      >
        <p className={cn("m-0 uppercase tracking-wide text-teal-800 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
          {SPONSOR_LENS_COMPARE_HEADING}
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          {summary.insufficientMessage}
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      aria-label={SPONSOR_LENS_COMPARE_HEADING}
      data-testid="sponsor-lens-compare-summary"
    >
      <p className={cn("m-0 uppercase tracking-wide text-teal-800 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
        {SPONSOR_LENS_COMPARE_HEADING}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SPONSOR_LENS_COMPARE_DISCLAIMER}</p>
      <ul
        className={cn("m-0 mt-3 list-disc space-y-1 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="sponsor-lens-compare-bullets"
      >
        {summary.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
