import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import type { NavLinkItem } from "@/lib/nav-config.types";
import {
  SETTINGS_NOTIFICATIONS_PATH,
  SETTINGS_ROOT_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Daily destinations shown first in dense sidebar groups; the rest sit behind “N more”.
 * Keep lists short (≈5) so the first viewport stays scannable.
 */
export const SIDEBAR_DAILY_HREFS_BY_GROUP: Readonly<Record<string, readonly string[]>> = {
  "operate-governance": [
    "/governance/approval-queue",
    "/governance/findings",
    "/governance/policy-packs",
    SIGNED_RECORDS_LIST_PATH,
    "/governance/alerts",
    "/governance/alert-rules",
  ],
  // Routine configuration leads; System health and Support are break-glass pages and Support is also
  // published as an inline bundle card on the settings hub, so neither needs a first-viewport slot.
  "operator-admin": [
    SETTINGS_ROOT_PATH,
    SETTINGS_WORKSPACE_SETTINGS_PATH,
    "/administration/users",
    SETTINGS_NOTIFICATIONS_PATH,
    "/administration/billing",
    ADMINISTRATION_SYSTEM_HEALTH_PATH,
  ],
};

export type SidebarDailyLinkSplit = {
  readonly daily: NavLinkItem[];
  readonly more: NavLinkItem[];
};

/**
 * Splits a cluster’s visible links into daily vs secondary. When the active path is in
 * `more`, that link is promoted into `daily` so the user never loses “you are here”.
 */
export function splitSidebarLinksDailyVsMore(
  groupId: string,
  links: readonly NavLinkItem[],
  pathname: string,
): SidebarDailyLinkSplit {
  const dailyHrefs = SIDEBAR_DAILY_HREFS_BY_GROUP[groupId];

  if (dailyHrefs === undefined || dailyHrefs.length === 0) {
    return { daily: [...links], more: [] };
  }

  const dailyHrefSet = new Set(dailyHrefs);
  const daily: NavLinkItem[] = [];
  const more: NavLinkItem[] = [];

  for (const link of links) {
    if (dailyHrefSet.has(link.href)) {
      daily.push(link);
    } else {
      more.push(link);
    }
  }

  // Preserve configured daily order.
  daily.sort((a, b) => dailyHrefs.indexOf(a.href) - dailyHrefs.indexOf(b.href));

  const activeInMore = more.find(
    (link) => pathname === link.href || pathname.startsWith(`${link.href.split("?")[0]}/`),
  );

  if (activeInMore !== undefined) {
    return {
      daily: [...daily, activeInMore],
      more: more.filter((link) => link.href !== activeInMore.href),
    };
  }

  return { daily, more };
}

export function sidebarMoreLinksLabel(groupLabel: string, count: number): string {
  if (count === 1) {
    return `1 more in ${groupLabel}`;
  }

  return `${count} more in ${groupLabel}`;
}
