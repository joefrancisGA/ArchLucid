import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const JIRA_CONNECTION_TEST_COLLAPSED_OPEN_PARAM = "jiraConnectionTestCollapsedOpen";

export function parseJiraConnectionTestCollapsedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function jiraConnectionTestCollapsedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, JIRA_CONNECTION_TEST_COLLAPSED_OPEN_PARAM);
}
