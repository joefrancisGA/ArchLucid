import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ReviewOutcomeTaxonomyEntry = {
  readonly term: string;
  readonly definition: string;
};

/** Conceptual order — aligned with outcome cards above, not alphabetical lookup. */
const REVIEW_OUTCOME_TAXONOMY_ENTRIES: readonly ReviewOutcomeTaxonomyEntry[] = [
  {
    term: "Decision",
    definition: "Approved architecture choice recorded on the finalized review record.",
  },
  {
    term: "Finding",
    definition: "Review observation requiring a resolve outcome, evidence, and traceability.",
  },
  {
    term: "Risk",
    definition: "Potential exposure framed with cited evidence.",
  },
  {
    term: "Monitored risk",
    definition: "Non-blocking posture captured under active monitoring.",
  },
  {
    term: "Control",
    definition: "Mitigation or safeguard referenced on the record.",
  },
  {
    term: "Approval status",
    definition:
      "Resolve outcome for citation; production deployments follow your enterprise change process.",
  },
  {
    term: "Deliverable",
    definition: "Packaged output for sponsors, review boards, or audit.",
  },
  {
    term: "Audit event",
    definition: "Lifecycle record in the immutable audit trail.",
  },
];

/**
 * Buyer-facing micro-legend so review findings, monitored risks, and approval lines read consistently.
 */
export function ReviewOutcomeTaxonomyLegend(): ReactElement {
  return (
    <dl
      className={cn("m-0 space-y-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="review-outcome-taxonomy-legend"
    >
      {REVIEW_OUTCOME_TAXONOMY_ENTRIES.map((entry) => (
        <div key={entry.term}>
          <dt className="font-semibold text-neutral-800 dark:text-neutral-200">{entry.term}</dt>
          <dd className="m-0 mt-0.5">{entry.definition}</dd>
        </div>
      ))}
    </dl>
  );
}
