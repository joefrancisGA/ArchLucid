export const SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_OPEN_PARAM = "sponsorWorkspaceHealthSessionScopeOpen";

export function parseSponsorWorkspaceHealthSessionScopeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorWorkspaceHealthSessionScopeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_OPEN_PARAM);
  } else {
    params.set(SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
