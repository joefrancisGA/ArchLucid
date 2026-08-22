import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { toReviewDisplayTitle } from "@/lib/review-display-title";

export const SECOND_REVIEW_PRIOR_RUN_QUERY_PARAM = "priorRunId";
export const SECOND_REVIEW_RERUN_QUERY_PARAM = "rerun";

/** Quick start continuation from a committed package — not a blank first review. */
export function secondReviewFromPriorHref(priorRunId: string): string {
  const trimmed = priorRunId.trim();
  const params = new URLSearchParams({
    path: "quick-review",
    [SECOND_REVIEW_RERUN_QUERY_PARAM]: trimmed,
    [SECOND_REVIEW_PRIOR_RUN_QUERY_PARAM]: trimmed,
    cloneFromRunId: trimmed,
    intent: "revised-clone",
  });

  return `/architecture/reviews/new?${params.toString()}`;
}

export function readPriorRunIdFromSearch(search: { get(name: string): string | null } | null): string | null {
  if (search === null) {
    return null;
  }

  const rerun = search.get(SECOND_REVIEW_RERUN_QUERY_PARAM)?.trim() ?? "";
  const prior = search.get(SECOND_REVIEW_PRIOR_RUN_QUERY_PARAM)?.trim() ?? "";
  const clone = search.get("cloneFromRunId")?.trim() ?? "";
  const resolved = rerun.length > 0 ? rerun : prior.length > 0 ? prior : clone;

  return resolved.length > 0 ? resolved : null;
}

export function compareToPriorPackageHref(priorRunId: string, laterRunId: string): string {
  return comparePageHrefAdaptive(priorRunId, laterRunId);
}

/** Recovers a usable inherited title from the prior package summary without inventing a default. */
export function priorPackageInheritedTitle(summary: {
  readonly displayName?: string | null;
  readonly description?: string | null;
}): string {
  const fromDisplay = toReviewDisplayTitle(summary.displayName);

  if (fromDisplay.length > 0) {
    return fromDisplay;
  }

  return toReviewDisplayTitle(summary.description);
}
