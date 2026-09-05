export const WORKSPACE_INTEGRATIONS_FINDING_ID_PARAM = "workspaceIntegrationsFindingId";

export function parseWorkspaceIntegrationsFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function workspaceIntegrationsDisclosureHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(WORKSPACE_INTEGRATIONS_FINDING_ID_PARAM);
  } else {
    params.set(WORKSPACE_INTEGRATIONS_FINDING_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
