import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CHANGES_SINCE_LAST_REVIEW_OPEN_PARAM = "changesSinceLastReviewOpen";

export function parseChangesSinceLastReviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function changesSinceLastReviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CHANGES_SINCE_LAST_REVIEW_OPEN_PARAM);
}
