import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_MANUAL_REVIEW_IDS_OPEN_PARAM = "compareManualReviewIdsOpen";

export function parseCompareManualReviewIdsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareManualReviewIdsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, COMPARE_MANUAL_REVIEW_IDS_OPEN_PARAM);
}
