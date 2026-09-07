import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export type ArchitectureCompareSiblingDefaults = {
  readonly architectureId: string;
  readonly priorRunId: string;
  readonly laterRunId: string;
};

function sortReviewsNewestFirst(
  reviews: readonly ArchitectureIdentityChildReviewSummary[],
): ArchitectureIdentityChildReviewSummary[] {
  return [...reviews].sort((left, right) => right.createdUtc.localeCompare(left.createdUtc));
}

/** Default Compare pickers to sibling reviews of the open architecture (AO-29). */
export function resolveArchitectureCompareSiblingDefaults(input: {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly baseRunId?: string | null;
}): ArchitectureCompareSiblingDefaults | null {
  const architectureId = input.architectureId.trim();

  if (architectureId.length === 0 || input.reviews.length < 2) {
    return null;
  }

  const sortedReviews = sortReviewsNewestFirst(input.reviews);
  const laterReview = sortedReviews[0];
  const priorReview = sortedReviews[1];

  if (laterReview === undefined || priorReview === undefined) {
    return null;
  }

  const baseRunId = input.baseRunId?.trim() ?? "";

  if (baseRunId.length === 0) {
    return {
      architectureId,
      priorRunId: priorReview.runId,
      laterRunId: laterReview.runId,
    };
  }

  const baseIndex = sortedReviews.findIndex((review) => review.runId === baseRunId);

  if (baseIndex < 0) {
    return {
      architectureId,
      priorRunId: priorReview.runId,
      laterRunId: laterReview.runId,
    };
  }

  const siblingReview = sortedReviews.find((review) => review.runId !== baseRunId);

  if (siblingReview === undefined) {
    return null;
  }

  const siblingIndex = sortedReviews.indexOf(siblingReview);
  const prior = baseIndex > siblingIndex ? sortedReviews[baseIndex]! : siblingReview;
  const later = baseIndex > siblingIndex ? siblingReview : sortedReviews[baseIndex]!;

  return {
    architectureId,
    priorRunId: prior.runId,
    laterRunId: later.runId,
  };
}
