import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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

  if (!/^\d+$/.test(trimmed)) {
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (step === null || step <= 1) {
      params.delete(FIRST_REVIEW_GUIDE_STEP_PARAM);
    } else {
      params.set(FIRST_REVIEW_GUIDE_STEP_PARAM, String(step));
    }
    },
  });
}
