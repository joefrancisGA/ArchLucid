export const CLOUD_CONNECTION_DISCONNECT_PARAM = "disconnectId";

export function parseCloudConnectionDisconnectIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function cloudConnectionDisconnectHrefFromSearch(
  currentSearch: string,
  connectionId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (connectionId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(CLOUD_CONNECTION_DISCONNECT_PARAM);
  } else {
    params.set(CLOUD_CONNECTION_DISCONNECT_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
