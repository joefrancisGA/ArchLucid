import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SIDEBAR_RECENT_ACTIVITY_OPEN_PARAM = "sidebarRecentOpen";

export function parseSidebarRecentActivityOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sidebarRecentActivityHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SIDEBAR_RECENT_ACTIVITY_OPEN_PARAM);
}
