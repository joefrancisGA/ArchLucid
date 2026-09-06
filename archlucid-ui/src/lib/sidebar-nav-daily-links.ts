import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import {
  INTERNAL_AGENT_MODEL_CATALOG_PATH,
  INTERNAL_FLEET_LLM_COGS_PATH,
  INTERNAL_HEALTH_PATH,
  INTERNAL_PRICING_QUOTE_AGING_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  GOVERNANCE_ADVISORY_SCANS_PATH,
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_SETUP_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import type { NavLinkItem } from "@/lib/nav-config.types";
import {
  SETTINGS_NOTIFICATIONS_PATH,
  SETTINGS_ROOT_PATH,
  SETTINGS_USERS_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

function sidebarLinkMatchesPathname(pathname: string, href: string): boolean {
  const linkPath = navHrefPathPart(href);
  const currentPath = navHrefPathPart(pathname);

  if (linkPath.length === 0) {
    return pathname === href;
  }

  if (currentPath === linkPath) {
    return true;
  }

  return currentPath.startsWith(`${linkPath}/`);
}

/**
 * Daily destinations shown first in dense sidebar groups; the rest sit behind “N more”.
 * Keep lists short (≈5) so the first viewport stays scannable.
 */
export const SIDEBAR_DAILY_HREFS_BY_GROUP: Readonly<Record<string, readonly string[]>> = {
  "operate-analysis": [
    EVIDENCE_GRAPH_PATH,
    ASK_REVIEW_QUESTIONS_PATH,
    SEARCH_REVIEW_EVIDENCE_PATH,
    SPONSOR_REPORT_PATH,
    COMPARE_TWO_REVIEWS_PATH,
  ],
  "operate-governance": [
    GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
    GOVERNANCE_APPROVAL_QUEUE_PATH,
    GOVERNANCE_SETUP_PATH,
    GOVERNANCE_FINDINGS_PATH,
    GOVERNANCE_ADVISORY_SCANS_PATH,
    GOVERNANCE_ALERTS_PATH,
  ],
  "operate-policy": [
    GOVERNANCE_POLICY_PACKS_PATH,
    GOVERNANCE_STANDARDS_AND_RULES_PATH,
  ],
  // Routine configuration leads; System health and Support are break-glass pages and Support is also
  // published as an inline bundle card on the settings hub, so neither needs a first-viewport slot.
  "operator-admin": [
    SETTINGS_ROOT_PATH,
    SETTINGS_WORKSPACE_SETTINGS_PATH,
    SETTINGS_USERS_PATH,
    SETTINGS_NOTIFICATIONS_PATH,
    SETTINGS_BILLING_PATH,
    ADMINISTRATION_SYSTEM_HEALTH_PATH,
  ],
  "operator-system-admin": [
    INTERNAL_HEALTH_PATH,
    INTERNAL_TRIAL_FUNNEL_PATH,
    INTERNAL_FLEET_LLM_COGS_PATH,
    INTERNAL_AGENT_MODEL_CATALOG_PATH,
    INTERNAL_PRICING_QUOTE_AGING_PATH,
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

  const activeInMore = more.find((link) => sidebarLinkMatchesPathname(pathname, link.href));

  if (activeInMore !== undefined) {
    return {
      daily: [...daily, activeInMore],
      more: more.filter((link) => link.href !== activeInMore.href),
    };
  }

  return { daily, more };
}

/** Secondary nav rows under a group heading — name what the disclosure reveals. */
const SIDEBAR_MORE_DISCLOSURE_DESTINATION_LABEL: Readonly<Record<string, string>> = {
  "operate-analysis": "Insights",
  "operate-governance": "Approval",
  "operate-policy": "Policy",
  "operate-infrastructure": "Infrastructure",
  "operator-admin": "Administration",
  "operator-system-admin": "Internal",
};

export function sidebarMoreLinksLabel(groupId: string, count: number, expanded = false): string {
  const destination =
    SIDEBAR_MORE_DISCLOSURE_DESTINATION_LABEL[groupId] ?? "sidebar";

  if (expanded) {
    return `Show fewer ${destination} destinations`;
  }

  if (count === 1) {
    return `Show 1 more ${destination} destination`;
  }

  return `Show ${count} more ${destination} destinations`;
}

/** Collapse label when the secondary nav disclosure is expanded. */
export function sidebarMoreLinksCollapseLabel(groupId: string): string {
  const destination =
    SIDEBAR_MORE_DISCLOSURE_DESTINATION_LABEL[groupId] ?? "sidebar";

  return `Show fewer ${destination} destinations`;
}
