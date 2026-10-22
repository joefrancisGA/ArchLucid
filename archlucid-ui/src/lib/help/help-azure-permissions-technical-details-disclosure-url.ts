import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_AZURE_PERMISSIONS_TECHNICAL_DETAILS_OPEN_PARAM = "helpAzurePermissionsTechnicalDetailsOpen";

export function parseHelpAzurePermissionsTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAzurePermissionsTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_AZURE_PERMISSIONS_TECHNICAL_DETAILS_OPEN_PARAM);
}
