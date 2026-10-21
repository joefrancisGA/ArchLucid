import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_SPONSOR_NARRATIVE_OPEN_PARAM = "compareSponsorNarrativeOpen";

export function parseCompareSponsorNarrativeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareSponsorNarrativeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, COMPARE_SPONSOR_NARRATIVE_OPEN_PARAM);
}
