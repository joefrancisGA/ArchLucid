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

export function infraResourceHubTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  technicalKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (technicalKey ?? "").trim();

  if (trimmed.length === 0 || !INFRA_RESOURCE_HUB_TECHNICAL_KEYS.includes(trimmed as InfraResourceHubTechnicalKey)) {
    params.delete(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM);
  } else {
    params.set(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
