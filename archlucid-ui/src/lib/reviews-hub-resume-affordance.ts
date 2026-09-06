export type ReviewsHubResumeAffordancePlan = {
  readonly showContinueLastViewed: boolean;
  readonly continueLastViewedVariant: "primary" | "outline";
};

export type ResolveReviewsHubResumeAffordanceInput = {
  readonly continueStripRunId: string | null;
  readonly continueLastViewedRunId: string | null;
};

/** Collapse duplicate resume affordances on the reviews hub — one filled primary per package. */
export function resolveReviewsHubResumeAffordancePlan(
  input: ResolveReviewsHubResumeAffordanceInput,
): ReviewsHubResumeAffordancePlan {
  const continueLastViewedRunId = input.continueLastViewedRunId?.trim() ?? "";
  const continueStripRunId = input.continueStripRunId?.trim() ?? "";

  if (continueLastViewedRunId.length === 0) {
    return { showContinueLastViewed: false, continueLastViewedVariant: "outline" };
  }

  if (continueStripRunId.length === 0) {
    return { showContinueLastViewed: true, continueLastViewedVariant: "primary" };
  }

  if (continueStripRunId === continueLastViewedRunId) {
    return { showContinueLastViewed: false, continueLastViewedVariant: "outline" };
  }

  return { showContinueLastViewed: true, continueLastViewedVariant: "outline" };
}
