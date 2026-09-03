export const ADMINISTRATION_SETTINGS_PATH = "/administration";
export const SETTINGS_MASTER_SEARCH_PARAM = "q";

export function parseSettingsMasterSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function settingsMasterSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = ADMINISTRATION_SETTINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(SETTINGS_MASTER_SEARCH_PARAM);
  } else {
    params.set(SETTINGS_MASTER_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function settingsMasterClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = ADMINISTRATION_SETTINGS_PATH,
): string {
  return settingsMasterSearchHrefFromSearch(currentSearch, "", pathname);
}
