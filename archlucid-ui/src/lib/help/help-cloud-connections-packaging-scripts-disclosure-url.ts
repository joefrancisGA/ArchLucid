import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_CLOUD_CONNECTIONS_PACKAGING_SCRIPTS_OPEN_PARAM = "helpCloudConnectionsPackagingScriptsOpen";

export function parseHelpCloudConnectionsPackagingScriptsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpCloudConnectionsPackagingScriptsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_CLOUD_CONNECTIONS_PACKAGING_SCRIPTS_OPEN_PARAM);
}
