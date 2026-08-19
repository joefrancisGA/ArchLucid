import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { COMPARE_HOW_IT_WORKS_SUMMARY } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-workspace-copy";

/** Collapsed page help — contextual help on the header remains the primary explanation surface. */
export function CompareHowComparisonWorksSection() {
  return (
    <details
      className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="compare-how-it-works"
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        How comparison works
      </summary>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_HOW_IT_WORKS_SUMMARY}</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Both reviews must be finalized before ArchLucid can compute a reliable delta.
      </p>
    </details>
  );
}
