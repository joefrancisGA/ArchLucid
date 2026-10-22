import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INTEGRATION_READINESS_TECH_ID_PARAM = "integrationReadinessTechId";

export function parseIntegrationReadinessTechIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function integrationReadinessTechnicalDetailsHrefFromSearch(
  currentSearch: string,
  connectorKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (connectorKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(INTEGRATION_READINESS_TECH_ID_PARAM);
    } else {
      params.set(INTEGRATION_READINESS_TECH_ID_PARAM, trimmed);
    }
    },
  });
}
