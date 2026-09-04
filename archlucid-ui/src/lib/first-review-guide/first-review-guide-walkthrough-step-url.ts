export const FIRST_REVIEW_GUIDE_PATH = "/architecture/first-review-guide" as const;

export const FIRST_REVIEW_GUIDE_STEP_PARAM = "guideStep";

export function parseFirstReviewGuideWalkthroughStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export function firstReviewGuideWalkthroughStepHrefFromSearch(
  currentSearch: string,
  step: number | null,
  pathname: string = FIRST_REVIEW_GUIDE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (step === null || step <= 1) {
    params.delete(FIRST_REVIEW_GUIDE_STEP_PARAM);
  } else {
    params.set(FIRST_REVIEW_GUIDE_STEP_PARAM, String(step));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
