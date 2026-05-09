import type { ReactElement } from "react";

/**
 * Buyer-facing micro-legend so manifest warnings, finding counts, and governance gate lines do not look contradictory.
 */
export function ReviewOutcomeTaxonomyLegend(): ReactElement {
  return (
    <p
      className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
      data-testid="review-outcome-taxonomy-legend"
    >
      <span className="font-medium text-neutral-700 dark:text-neutral-300">How to read this row: </span>
      Findings are architecture review outcomes tied to evidence. Manifest warnings are policy or completeness flags on
      the finalized record. The approval status reflects your governance gate for this package (not the same as finding
      severity).
    </p>
  );
}
