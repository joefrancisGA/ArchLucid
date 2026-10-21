import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM = "reviewsNewMoreWaysToStartOpen";

export function parseReviewsNewMoreWaysToStartOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewsNewMoreWaysToStartDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM);
}
