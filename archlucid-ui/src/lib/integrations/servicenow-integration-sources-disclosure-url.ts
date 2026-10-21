import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SERVICENOW_INTEGRATION_SOURCES_OPEN_PARAM = "servicenowIntegrationSourcesOpen";

export function parseServicenowIntegrationSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function servicenowIntegrationSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SERVICENOW_INTEGRATION_SOURCES_OPEN_PARAM);
}
