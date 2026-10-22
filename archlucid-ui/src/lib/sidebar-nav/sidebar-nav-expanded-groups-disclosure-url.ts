import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";
import { isSidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (expandedGroupIds.length === 0) {
      params.delete(SIDEBAR_NAV_EXPANDED_GROUPS_PARAM);
    } else {
      params.set(SIDEBAR_NAV_EXPANDED_GROUPS_PARAM, expandedGroupIds.join(","));
    }
    },
  });
}
