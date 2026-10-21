import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_DRAFT_QUALITY_ATTR_ENCOURAGE_PARAM = "qualityAttrEncourage";

export function parseArchitectureDraftQualityAttrEncourageOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDraftQualityAttrEncourageConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, ARCHITECTURE_DRAFT_QUALITY_ATTR_ENCOURAGE_PARAM);
}
