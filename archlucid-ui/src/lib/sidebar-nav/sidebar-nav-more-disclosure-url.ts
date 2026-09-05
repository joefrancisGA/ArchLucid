export const SIDEBAR_NAV_MORE_GROUP_PARAM = "sidebarMoreGroup";

export function parseSidebarNavMoreGroupFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function sidebarNavMoreDisclosureHrefFromSearch(
  currentSearch: string,
  groupId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (groupId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(SIDEBAR_NAV_MORE_GROUP_PARAM);
  } else {
    params.set(SIDEBAR_NAV_MORE_GROUP_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
