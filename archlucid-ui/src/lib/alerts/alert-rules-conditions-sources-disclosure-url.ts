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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ALERT_RULES_CONDITIONS_SOURCES_OPEN_PARAM);
  } else {
    params.set(ALERT_RULES_CONDITIONS_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
