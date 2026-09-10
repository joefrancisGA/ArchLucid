export const JIRA_WORKSPACE_ROUTING_COLLAPSED_OPEN_PARAM = "jiraWorkspaceRoutingCollapsedOpen";

export function parseJiraWorkspaceRoutingCollapsedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function jiraWorkspaceRoutingCollapsedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(JIRA_WORKSPACE_ROUTING_COLLAPSED_OPEN_PARAM);
  } else {
    params.set(JIRA_WORKSPACE_ROUTING_COLLAPSED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
