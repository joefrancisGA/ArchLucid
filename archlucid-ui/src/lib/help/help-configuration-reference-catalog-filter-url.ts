import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_CONFIGURATION_REFERENCE_CATALOG_FILTER_PARAM = "helpConfigurationReferenceCatalogFilter";

export function parseHelpConfigurationReferenceCatalogFilterFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpConfigurationReferenceCatalogFilterHrefFromSearch(
  currentSearch: string,
  filterQuery: string,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = filterQuery.trim();

    if (trimmed.length === 0) {
      params.delete(HELP_CONFIGURATION_REFERENCE_CATALOG_FILTER_PARAM);
    } else {
      params.set(HELP_CONFIGURATION_REFERENCE_CATALOG_FILTER_PARAM, trimmed);
    }
    },
  });
}
