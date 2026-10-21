import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SCOPE_SWITCHER_TECHNICAL_DETAILS_OPEN_PARAM = "scopeSwitcherTechnicalDetailsOpen";

export function parseScopeSwitcherTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function scopeSwitcherTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SCOPE_SWITCHER_TECHNICAL_DETAILS_OPEN_PARAM);
}
