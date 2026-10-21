import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (findingId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(WORKSPACE_INTEGRATIONS_FINDING_ID_PARAM);
    } else {
      params.set(WORKSPACE_INTEGRATIONS_FINDING_ID_PARAM, trimmed);
    }
    },
  });
}
