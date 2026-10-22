import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_CONFIGURATION_REFERENCE_CATALOG_OPEN_PARAM = "helpConfigurationReferenceCatalogOpen";

export function parseHelpConfigurationReferenceCatalogOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpConfigurationReferenceCatalogDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_CONFIGURATION_REFERENCE_CATALOG_OPEN_PARAM);
}
