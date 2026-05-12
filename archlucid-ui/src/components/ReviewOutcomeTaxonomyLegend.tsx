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
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Finding</strong> — architecture review
      outcome tied to cited evidence (severity is not approval).{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Warning</strong> — non-blocking policy or
      completeness gap on the sealed record.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Approval status</strong> — governance
      disposition for this package (not production deployment authority).
    </p>
  );
}