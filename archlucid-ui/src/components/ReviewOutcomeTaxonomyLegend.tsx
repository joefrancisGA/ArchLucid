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
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Decision</strong> — approved architecture choice recorded on the sealed package.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Finding</strong> — review observation that requires disposition or monitoring (severity is not approval status).{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Risk</strong> — potential exposure framed with cited evidence.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Control</strong> — mitigation or safeguard referenced on the record.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Deliverable</strong> — packaged output for sponsors, review boards, or audit.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Audit event</strong> — lifecycle record in the immutable audit trail.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Monitored risk</strong> — non-blocking posture captured under active governance oversight.{" "}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">Approval status</strong> — governance disposition for citation; production deployments follow your enterprise change process.
    </p>
  );
}
