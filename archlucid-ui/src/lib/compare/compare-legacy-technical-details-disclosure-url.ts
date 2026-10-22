import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_LEGACY_TECHNICAL_DETAILS_OPEN_PARAM = "compareLegacyTechnicalDetailsOpen";

export function parseCompareLegacyTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareLegacyTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, COMPARE_LEGACY_TECHNICAL_DETAILS_OPEN_PARAM);
}
