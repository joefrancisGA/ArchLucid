import { resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM = "infraResourceHubTechnicalKey";

export const INFRA_RESOURCE_HUB_TECHNICAL_KEYS = [
  "cloudResourceId",
  "armResourcePath",
  "terraformAddress",
] as const;

export type InfraResourceHubTechnicalKey = (typeof INFRA_RESOURCE_HUB_TECHNICAL_KEYS)[number];

export function parseInfraResourceHubTechnicalKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!INFRA_RESOURCE_HUB_TECHNICAL_KEYS.includes(trimmed as InfraResourceHubTechnicalKey)) {
    return "";
  }

  return trimmed;
}

export function buildInfraResourceHubTechnicalDisclosureScopedHref(
  cloudResourceId: string,
  currentSearch: string,
  technicalKey: string | null,
  pathname: string,
  scope: {
    readonly snapshotId?: string;
    readonly runId?: string;
  },
): string {
  const scopedHubHref = resourceHubFilterHrefFromSearch(cloudResourceId, currentSearch, {
    snapshotId: scope.snapshotId,
    runId: scope.runId,
  });
  const scopedQuery = scopedHubHref.includes("?")
    ? scopedHubHref.slice(scopedHubHref.indexOf("?") + 1)
    : "";

  return infraResourceHubTechnicalDisclosureHrefFromSearch(scopedQuery, technicalKey, pathname);
}

export function infraResourceHubTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  technicalKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "infra-resource-hub-run-scope" },
    mutate: (params) => {
    const trimmed = (technicalKey ?? "").trim();

    if (trimmed.length === 0 || !INFRA_RESOURCE_HUB_TECHNICAL_KEYS.includes(trimmed as InfraResourceHubTechnicalKey)) {
      params.delete(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM);
    } else {
      params.set(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM, trimmed);
    }
    },
  });
}
