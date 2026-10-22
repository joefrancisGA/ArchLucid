import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM = "reviewPackageSponsorHandoffMoreExportsOpen";

export function parseReviewPackageSponsorHandoffMoreExportsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewPackageSponsorHandoffMoreExportsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM);
}
