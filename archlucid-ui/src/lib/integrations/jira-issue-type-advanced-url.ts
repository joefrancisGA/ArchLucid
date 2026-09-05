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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(JIRA_ISSUE_TYPE_ADVANCED_OPEN_PARAM);
  } else {
    params.set(JIRA_ISSUE_TYPE_ADVANCED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
