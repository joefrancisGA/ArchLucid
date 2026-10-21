import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GUIDED_INTAKE_VIEW_ALL_CLARIFICATIONS_OPEN_PARAM = "guidedIntakeViewAllClarificationsOpen";

export function parseGuidedIntakeViewAllClarificationsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function guidedIntakeViewAllClarificationsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GUIDED_INTAKE_VIEW_ALL_CLARIFICATIONS_OPEN_PARAM);
}
