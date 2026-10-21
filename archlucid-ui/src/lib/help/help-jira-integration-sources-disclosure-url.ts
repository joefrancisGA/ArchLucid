import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_JIRA_INTEGRATION_SOURCES_OPEN_PARAM = "helpJiraIntegrationSourcesOpen";

export function parseHelpJiraIntegrationSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpJiraIntegrationSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_JIRA_INTEGRATION_SOURCES_OPEN_PARAM);
}
