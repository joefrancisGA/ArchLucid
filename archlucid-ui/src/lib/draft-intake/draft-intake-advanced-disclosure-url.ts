import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const DRAFT_INTAKE_ADVANCED_OPEN_PARAM = "draftIntakeAdvancedOpen";

export function parseDraftIntakeAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function draftIntakeAdvancedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DRAFT_INTAKE_ADVANCED_OPEN_PARAM);
}
