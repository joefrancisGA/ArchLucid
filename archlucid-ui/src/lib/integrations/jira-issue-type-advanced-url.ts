import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const JIRA_ISSUE_TYPE_ADVANCED_OPEN_PARAM = "jiraIssueTypeAdvancedOpen";

export function parseJiraIssueTypeAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function jiraIssueTypeAdvancedHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, JIRA_ISSUE_TYPE_ADVANCED_OPEN_PARAM);
}
