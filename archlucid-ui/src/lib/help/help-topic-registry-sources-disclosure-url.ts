import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_TOPIC_REGISTRY_SOURCES_OPEN_PARAM = "helpTopicRegistrySourcesOpen";

export function parseHelpTopicRegistrySourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpTopicRegistrySourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_TOPIC_REGISTRY_SOURCES_OPEN_PARAM);
}
