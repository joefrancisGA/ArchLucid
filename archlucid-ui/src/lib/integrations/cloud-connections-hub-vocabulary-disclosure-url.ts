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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CLOUD_CONNECTIONS_HUB_VOCABULARY_OPEN_PARAM);
  } else {
    params.set(CLOUD_CONNECTIONS_HUB_VOCABULARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
