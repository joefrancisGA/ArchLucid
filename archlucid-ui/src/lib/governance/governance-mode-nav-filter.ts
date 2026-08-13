import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  LEGACY_ALERTS_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";

/** Governance destinations hidden until the operator enables governance view. */
export const GOVERNANCE_MODE_HIDDEN_NAV_HREFS = new Set<string>([
  GOVERNANCE_POLICY_PACKS_PATH,
  LEGACY_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  "/governance/findings",
  "/governance/exceptions",
  "/governance/decision-register",
  "/governance/recurrence-schedules",
  "/governance/setup",
  GOVERNANCE_AUDIT_PATH,
  LEGACY_AUDIT_PATH,
  GOVERNANCE_ALERTS_PATH,
  LEGACY_ALERTS_PATH,
  "/administration/connection-status",
]);

const GOVERNANCE_NAV_GROUP_IDS = new Set<string>(["operate-governance"]);

export function filterNavLinksForGovernanceMode(
  links: ReadonlyArray<NavLinkItem>,
  isGovernanceModeEnabled: boolean,
): NavLinkItem[] {
  if (isGovernanceModeEnabled) {
    return [...links];
  }

  return links.filter((link) => !GOVERNANCE_MODE_HIDDEN_NAV_HREFS.has(link.href));
}

export function filterNavGroupsForGovernanceMode(
  rows: ReadonlyArray<NavGroupWithVisibleLinks>,
  isGovernanceModeEnabled: boolean,
): NavGroupWithVisibleLinks[] {
  if (isGovernanceModeEnabled) {
    return [...rows];
  }

  return rows
    .filter((row) => !GOVERNANCE_NAV_GROUP_IDS.has(row.group.id))
    .map((row) => ({
      group: row.group,
      visibleLinks: filterNavLinksForGovernanceMode(row.visibleLinks, isGovernanceModeEnabled),
    }))
    .filter((row) => row.visibleLinks.length > 0);
}

export function isGovernanceModeHiddenNavHref(href: string): boolean {
  return GOVERNANCE_MODE_HIDDEN_NAV_HREFS.has(href);
}

export function filterNavGroupConfigsForGovernanceMode(
  groups: ReadonlyArray<NavGroupConfig>,
  isGovernanceModeEnabled: boolean,
): NavGroupConfig[] {
  if (isGovernanceModeEnabled) {
    return [...groups];
  }

  return groups
    .filter((group) => !GOVERNANCE_NAV_GROUP_IDS.has(group.id))
    .map((group) => ({
      ...group,
      links: filterNavLinksForGovernanceMode(group.links, isGovernanceModeEnabled),
    }))
    .filter((group) => group.links.length > 0);
}
