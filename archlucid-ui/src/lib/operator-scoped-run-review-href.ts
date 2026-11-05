import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";

/** Operate surfaces (alerts, advisory, digests) scoped to a review run id. */
export function resolveOperatorScopedRunReviewHref(
  runId: string,
  architectureId?: string | null,
): string {
  return resolveGovernanceScopedReviewOpenHref({ runId, architectureId });
}
