import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CLOUD_CONNECTIONS_HUB_VOCABULARY_OPEN_PARAM = "cloudConnectionsHubVocabularyOpen";

export function parseCloudConnectionsHubVocabularyOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function cloudConnectionsHubVocabularyDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CLOUD_CONNECTIONS_HUB_VOCABULARY_OPEN_PARAM);
}
