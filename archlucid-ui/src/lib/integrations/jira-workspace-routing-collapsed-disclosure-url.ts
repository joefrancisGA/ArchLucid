import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, JIRA_WORKSPACE_ROUTING_COLLAPSED_OPEN_PARAM);
}
