export const COLLAPSIBLE_JSON_EXPAND_PATH_PARAM = "collapsibleJsonExpandPath";

export function parseCollapsibleJsonExpandPathFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function collapsibleJsonExpandPathDisclosureHrefFromSearch(
  currentSearch: string,
  expandPath: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (expandPath === null || expandPath.trim().length === 0) {
    params.delete(COLLAPSIBLE_JSON_EXPAND_PATH_PARAM);
  } else {
    params.set(COLLAPSIBLE_JSON_EXPAND_PATH_PARAM, expandPath.trim());
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
