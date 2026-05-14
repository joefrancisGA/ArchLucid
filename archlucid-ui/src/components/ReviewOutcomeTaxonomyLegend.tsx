import type { ReactElement } from "react";

/**
 * Buyer-facing micro-legend so review findings, monitored risks, and approval lines read consistently.
 */
export function ReviewOutcomeTaxonomyLegend(): ReactElement {
  return (
    <p
      className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
      data-testid="review-outcome-taxonomy-legend"
    >
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Finding</strong> — discrete architecture review outcome tied to cited evidence (severity is not approval status).{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Monitored risk</strong> — non-blocking posture captured on the sealed record under active governance oversight.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Approval status</strong> — records governance disposition for citation; operational deployments remain with your enterprise change process.
    </p>
  );
}
