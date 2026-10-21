import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SPONSOR_SCORECARD_EMPTY_PREVIEW_OPEN_PARAM = "sponsorScorecardEmptyPreviewOpen";

export function parseSponsorScorecardEmptyPreviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorScorecardEmptyPreviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SPONSOR_SCORECARD_EMPTY_PREVIEW_OPEN_PARAM);
}
