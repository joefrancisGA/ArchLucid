export const ALERT_ROUTING_ADVANCED_OPEN_PARAM = "alertRoutingAdvancedOpen";
export const ALERT_ROUTING_EXACT_SEVERITIES_OPEN_PARAM = "alertRoutingExactSeveritiesOpen";

export function parseAlertRoutingAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseAlertRoutingExactSeveritiesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function alertRoutingCriteriaHrefFromSearch(
  currentSearch: string,
  options: {
    readonly showAdvancedCategories: boolean;
    readonly showExactSeverities: boolean;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!options.showAdvancedCategories) {
    params.delete(ALERT_ROUTING_ADVANCED_OPEN_PARAM);
  } else {
    params.set(ALERT_ROUTING_ADVANCED_OPEN_PARAM, "1");
  }

  if (!options.showExactSeverities) {
    params.delete(ALERT_ROUTING_EXACT_SEVERITIES_OPEN_PARAM);
  } else {
    params.set(ALERT_ROUTING_EXACT_SEVERITIES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
