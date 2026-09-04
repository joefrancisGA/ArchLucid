import { resolveFirstReviewGuideRequiredBlockers } from "./first-review-guide-blockers";
import type { FirstReviewGuideStateInput } from "./first-review-guide-status";
import { hasSealedReviewRecord } from "@/lib/first-review-guide-persistence";

export type FirstReviewGuideReadinessKind =
  | "ready-to-start"
  | "required-setup-remains"
  | "in-progress"
  | "completed";

export type FirstReviewGuideReadiness = {
  readonly kind: FirstReviewGuideReadinessKind;
  readonly headline: string;
  readonly detail: string | null;
};

export function resolveFirstReviewGuideReadiness(input: FirstReviewGuideStateInput): FirstReviewGuideReadiness {
  const { commitContext } = input;
  const blockers = resolveFirstReviewGuideRequiredBlockers(input);

  if (hasSealedReviewRecord(commitContext)) {
    return {
      kind: "completed",
      headline: "First review completed",
      detail: "Your finalized architecture review is ready to inspect and share.",
    };
  }

  if (blockers.length > 0) {
    return {
      kind: "required-setup-remains",
      headline: "One required setup item remains",
      detail: blockers[0]?.title ?? null,
    };
  }

  if (commitContext.latestRunId !== null) {
    return {
      kind: "in-progress",
      headline: "First review in progress",
      detail: "Continue where you left off — progress updates from your workspace reviews.",
    };
  }

  if (!input.canExecute) {
    return {
      kind: "ready-to-start",
      headline: "Ready to explore",
      detail:
        "Your role can read this guide and open the sample review. Ask a workspace administrator for review creation permission to begin your own review.",
    };
  }

  return {
    kind: "ready-to-start",
    headline: "Ready to start",
    detail: "Optional workspace setup can be completed later.",
  };
}
