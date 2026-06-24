import { isNavLinkActive } from "@/lib/nav-link-active";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import {
  isSidebarCollapsibleNavGroupId,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

/** Collapsible nav groups that contain an active link for the current pathname. */
export function findSidebarNavGroupIdsForActivePath(
  rows: ReadonlyArray<NavGroupWithVisibleLinks>,
  pathname: string,
): SidebarCollapsibleNavGroupId[] {
  const activeGroupIds: SidebarCollapsibleNavGroupId[] = [];

  for (const row of rows) {
    if (!isSidebarCollapsibleNavGroupId(row.group.id)) {
      continue;
    }

    const hasActiveChild = row.visibleLinks.some((link) => isNavLinkActive(pathname, link.href));

    if (hasActiveChild) {
      activeGroupIds.push(row.group.id);
    }
  }

  return activeGroupIds;
}
