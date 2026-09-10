export const SETTINGS_DESTINATION_META_DESTINATION_ID_PARAM = "settingsDestinationMetaDestinationId";

export function parseSettingsDestinationMetaDestinationIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function settingsDestinationMetaDisclosureHrefFromSearch(
  currentSearch: string,
  destinationId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (destinationId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(SETTINGS_DESTINATION_META_DESTINATION_ID_PARAM);
  } else {
    params.set(SETTINGS_DESTINATION_META_DESTINATION_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
