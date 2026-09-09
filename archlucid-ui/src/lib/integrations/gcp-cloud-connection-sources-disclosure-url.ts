export const GCP_CLOUD_CONNECTION_SOURCES_OPEN_PARAM = "gcpCloudConnectionSourcesOpen";

export function parseGcpCloudConnectionSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function gcpCloudConnectionSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GCP_CLOUD_CONNECTION_SOURCES_OPEN_PARAM);
  } else {
    params.set(GCP_CLOUD_CONNECTION_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
