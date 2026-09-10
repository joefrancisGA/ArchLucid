import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";
import { isSidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";

export const SIDEBAR_NAV_EXPANDED_GROUPS_PARAM = "sidebarNavExpandedGroups";

export function parseSidebarNavExpandedGroupsFromSearch(raw: string | null | undefined): readonly SidebarCollapsibleNavGroupId[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment): segment is SidebarCollapsibleNavGroupId => isSidebarCollapsibleNavGroupId(segment));
}

export function sidebarNavExpandedGroupsDisclosureHrefFromSearch(
  currentSearch: string,
  expandedGroupIds: readonly SidebarCollapsibleNavGroupId[],
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (expandedGroupIds.length === 0) {
    params.delete(SIDEBAR_NAV_EXPANDED_GROUPS_PARAM);
  } else {
    params.set(SIDEBAR_NAV_EXPANDED_GROUPS_PARAM, expandedGroupIds.join(","));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
