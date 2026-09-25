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
  const params = new URLSearchParams(currentSearch);
  const trimmed = filterQuery.trim();

  if (trimmed.length === 0) {
    params.delete(HELP_CONFIGURATION_REFERENCE_CATALOG_FILTER_PARAM);
  } else {
    params.set(HELP_CONFIGURATION_REFERENCE_CATALOG_FILTER_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
