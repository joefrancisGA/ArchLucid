import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEWS_NEW_RETURNING_JOB_CHOOSER_OPEN_PARAM = "reviewsNewReturningJobChooserOpen";

export function parseReviewsNewReturningJobChooserOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewsNewReturningJobChooserDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEWS_NEW_RETURNING_JOB_CHOOSER_OPEN_PARAM);
}
