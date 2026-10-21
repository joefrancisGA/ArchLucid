import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GCP_CLOUD_CONNECTION_SOURCES_OPEN_PARAM);
}
