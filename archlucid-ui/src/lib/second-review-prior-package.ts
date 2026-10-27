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

export type PriorPackageSemanticCounts = {
  readonly actorCount: number | null;
  readonly assumptionCount: number | null;
  readonly decisionCount: number | null;
  readonly requirementCount: number | null;
};

/** Formats inherited semantic counts for the prior-package strip (TB-2350). */
function pushPositiveCountSegment(
  segments: string[],
  value: number | null,
  singular: string,
  plural: string,
): void {
  if (value === null || value === undefined) {
    return;
  }

  if (value <= 0) {
    return;
  }

  segments.push(`${value} ${value === 1 ? singular : plural}`);
}

export function priorPackageInheritedSemanticSummary(counts: PriorPackageSemanticCounts): string {
  const segments: string[] = [];
  const omittedFields: string[] = [];

  if (counts.actorCount === null || counts.actorCount === undefined) {
    omittedFields.push("actor count");
  } else {
    pushPositiveCountSegment(segments, counts.actorCount, "actor", "actors");
  }

  if (counts.assumptionCount === null || counts.assumptionCount === undefined) {
    omittedFields.push("assumption count");
  } else {
    pushPositiveCountSegment(segments, counts.assumptionCount, "assumption", "assumptions");
  }

  if (counts.requirementCount === null || counts.requirementCount === undefined) {
    omittedFields.push("requirement count");
  } else {
    pushPositiveCountSegment(segments, counts.requirementCount, "requirement", "requirements");
  }

  if (counts.decisionCount === null || counts.decisionCount === undefined) {
    omittedFields.push("decision count");
  } else {
    pushPositiveCountSegment(segments, counts.decisionCount, "decision", "decisions");
  }

  if (omittedFields.length === 4) {
    return "Semantic object counts from the prior package were not stored.";
  }

  if (segments.length === 0) {
    if (omittedFields.length > 0) {
      return `Semantic objects from the prior package will carry forward when you start this review. ${omittedFields.join(", ")} was not stored.`;
    }

    return "Semantic objects from the prior package will carry forward when you start this review.";
  }

  const carryLine = `Carrying forward ${segments.join(", ")} from the prior package.`;

  if (omittedFields.length === 0) {
    return carryLine;
  }

  return `${carryLine} ${omittedFields.join(", ")} was not stored.`;
}
