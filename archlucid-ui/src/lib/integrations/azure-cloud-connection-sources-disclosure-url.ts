import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AZURE_CLOUD_CONNECTION_SOURCES_OPEN_PARAM = "azureCloudConnectionSourcesOpen";

export function parseAzureCloudConnectionSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function azureCloudConnectionSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AZURE_CLOUD_CONNECTION_SOURCES_OPEN_PARAM);
}
