import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_PRESENTER_MODE_PARAM = "presenter";

export function parseReviewPresenterModeFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewPresenterModeHrefFromSearch(
  currentSearch: string,
  presenterMode: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, presenterMode, pathname, REVIEW_PRESENTER_MODE_PARAM);
}
