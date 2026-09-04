export const REVIEW_FINDINGS_SHOW_LOW_PARAM = "showLow";
export const REVIEW_FINDINGS_SHOW_ADVISORY_PARAM = "showAdvisory";
export const REVIEW_FINDINGS_HIDE_GENERIC_PARAM = "hideGeneric";

function parseBooleanFlagFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReviewFindingsShowLowFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanFlagFromSearch(raw);
}

export function parseReviewFindingsShowAdvisoryFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanFlagFromSearch(raw);
}

export function parseReviewFindingsHideGenericFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanFlagFromSearch(raw);
}

export function reviewFindingsVisibilityHrefFromSearch(
  currentSearch: string,
  options: {
    readonly showLowConfidence: boolean;
    readonly showAdvisory: boolean;
    readonly hideGenericLowDensity: boolean;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!options.showLowConfidence) {
    params.delete(REVIEW_FINDINGS_SHOW_LOW_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_SHOW_LOW_PARAM, "1");
  }

  if (!options.showAdvisory) {
    params.delete(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM, "1");
  }

  if (!options.hideGenericLowDensity) {
    params.delete(REVIEW_FINDINGS_HIDE_GENERIC_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_HIDE_GENERIC_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
