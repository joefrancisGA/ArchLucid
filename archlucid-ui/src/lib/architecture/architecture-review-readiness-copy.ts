import { GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS } from "@/lib/guided-intake-copy";

import {
  listUnconfirmedStructuredBriefFieldLabels,
  type ArchitectureDraftStructuredBriefState,
} from "./architecture-draft-structured-brief-state";

const MIN_OUTCOME_CHARS = 10;

/** Stable ids returned by validateArchitectureReviewReadiness — map to operator-facing copy at display time. */
export type ArchitectureReviewReadinessBlockerId =
  | "system-name"
  | "architecture-overview"
  | "business-outcome"
  | "confirmed-actor"
  | "quality-attributes"
  | "structured-brief-placeholders";

export const ARCHITECTURE_REVIEW_READINESS_BLOCKER_MESSAGES: Readonly<
  Record<ArchitectureReviewReadinessBlockerId, string>
> = {
  "system-name": "a system name",
  "architecture-overview": `an architecture overview of at least ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS} characters`,
  "business-outcome": `a business outcome of at least ${MIN_OUTCOME_CHARS} characters`,
  "confirmed-actor": "at least one confirmed person or system in the actor list",
  "quality-attributes":
    "at least one quality attribute (numeric such as RTO 4h or p95 latency 200ms, or qualitative such as defense in depth)",
  "structured-brief-placeholders":
    "confirmed constraints, assumptions, capabilities, or quality attributes instead of Unknown — confirm before review placeholders",
};

export function formatArchitectureReviewReadinessMessage(
  blockers: readonly ArchitectureReviewReadinessBlockerId[],
  structuredBrief?: ArchitectureDraftStructuredBriefState,
): string {
  if (blockers.length === 0) {
    return "";
  }

  const labels = blockers.flatMap((blockerId) => {
    if (blockerId === "structured-brief-placeholders" && structuredBrief !== undefined) {
      const placeholderFields = listUnconfirmedStructuredBriefFieldLabels(structuredBrief);

      if (placeholderFields.length > 0) {
        return placeholderFields.map(
          (fieldLabel) =>
            `confirmed ${fieldLabel.toLowerCase()} instead of Unknown — confirm before review placeholders`,
        );
      }
    }

    return [ARCHITECTURE_REVIEW_READINESS_BLOCKER_MESSAGES[blockerId]];
  });

  if (labels.length === 1) {
    return `Add ${labels[0]} before starting a review.`;
  }

  return `Add ${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]} before starting a review.`;
}
