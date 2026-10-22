import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ALERT_RULES_CONDITIONS_SOURCES_OPEN_PARAM = "alertRulesConditionsSourcesOpen";

export function parseAlertRulesConditionsSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function alertRulesConditionsSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ALERT_RULES_CONDITIONS_SOURCES_OPEN_PARAM);
}
