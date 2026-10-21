import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_OPEN_PARAM);
}
