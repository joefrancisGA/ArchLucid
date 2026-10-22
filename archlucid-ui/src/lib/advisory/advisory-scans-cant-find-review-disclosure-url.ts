import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADVISORY_SCANS_CANT_FIND_REVIEW_OPEN_PARAM = "advisoryScansCantFindReviewOpen";

export function parseAdvisoryScansCantFindReviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScansCantFindReviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADVISORY_SCANS_CANT_FIND_REVIEW_OPEN_PARAM);
}
