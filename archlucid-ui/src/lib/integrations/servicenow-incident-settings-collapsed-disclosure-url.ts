export const SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_OPEN_PARAM = "serviceNowIncidentSettingsCollapsedOpen";

export function parseServiceNowIncidentSettingsCollapsedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function serviceNowIncidentSettingsCollapsedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_OPEN_PARAM);
  } else {
    params.set(SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
