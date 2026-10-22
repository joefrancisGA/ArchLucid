import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_STALE_INPUTS_TECHNICAL_IDS_OPEN_PARAM = "compareStaleInputsTechnicalIdsOpen";

export function parseCompareStaleInputsTechnicalIdsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareStaleInputsTechnicalIdsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, COMPARE_STALE_INPUTS_TECHNICAL_IDS_OPEN_PARAM);
}
