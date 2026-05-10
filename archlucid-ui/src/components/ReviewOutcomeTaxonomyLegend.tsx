import type { ReactElement } from "react";

/**
 * Buyer-facing micro-legend so review warnings, finding counts, and approval lines read consistently.
 */
export function ReviewOutcomeTaxonomyLegend(): ReactElement {
  return (
    <p
      className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
      data-testid="review-outcome-taxonomy-legend"
    >
      Findings are architecture review outcomes linked to evidence. Review warnings flag policy or completeness gaps on
      the finalized record. Approval status reflects the governance path for this package — separate from finding
      severity.
    </p>
  );
}
