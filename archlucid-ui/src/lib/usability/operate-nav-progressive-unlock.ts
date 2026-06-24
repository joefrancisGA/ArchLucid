/**
 * Progressive Operate nav unlock: pilot-only (0) → analysis (1) → governance (2).
 */

export type OperateNavUnlockPhase = 0 | 1 | 2;

export const OPERATE_NAV_UNLOCK_STORAGE_KEY = "archlucid.operateNavUnlockPhase.v1";

export const OPERATE_NAV_UNLOCK_CHANGED_EVENT = "archlucid-operate-nav-unlock-changed";

const OPERATE_NAV_GROUP_IDS = new Set<string>([
  "operate-analysis",
  "operate-governance",
  "operate-reports",
  "operate-integrations",
]);

const LEGACY_SIDEBAR_PREFERENCE_KEYS = [
  "archlucid_nav_sidebar_groups.v2",
  "archlucid_nav_show_administration",
  "archlucid_nav_show_extended",
  "archlucid_nav_show_advanced",
  "archlucid-nav-expanded",
  "archlucid-nav-collapsed-pilot-expanded",
] as const;

/** Hrefs hidden until phase 2 (governance cluster). */
const GOVERNANCE_PHASE_HREFS = new Set<string>([
  "/alerts",
  "/policy-packs",
  "/governance",
  "/audit",
  "/governance/decision-register",
]);

/** Duplicate/near-duplicate routes hidden from primary nav (deep links still work). */
const NAV_CONSOLIDATED_OMIT_HREFS = new Set<string>([
  "/governance/dashboard",
  "/value-report/pilot",
  "/value-report/roi",
  "/digests",
  "/digest-subscriptions",
]);

export function isOperateNavGroupId(groupId: string): boolean {
  return OPERATE_NAV_GROUP_IDS.has(groupId);
}

function hasLegacySidebarNavPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return LEGACY_SIDEBAR_PREFERENCE_KEYS.some((key) => window.localStorage.getItem(key) !== null);
  }
  catch {
    return false;
  }
}

function parseStoredOperateNavUnlockPhase(raw: string): OperateNavUnlockPhase | null {
  if (raw === "0" || raw === "1" || raw === "2") {
    return Number(raw) as OperateNavUnlockPhase;
  }

  return null;
}

export function readOperateNavUnlockPhase(): OperateNavUnlockPhase {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(OPERATE_NAV_UNLOCK_STORAGE_KEY);
    const parsed = raw === null ? null : parseStoredOperateNavUnlockPhase(raw);

    if (parsed !== null) {
      return parsed;
    }

    if (hasLegacySidebarNavPreference()) {
      return 1;
    }
  }
  catch {
    /* ignore */
  }

  return 0;
}

export function writeOperateNavUnlockPhase(phase: OperateNavUnlockPhase): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(OPERATE_NAV_UNLOCK_STORAGE_KEY, String(phase));
    window.dispatchEvent(new Event(OPERATE_NAV_UNLOCK_CHANGED_EVENT));
  }
  catch {
    /* ignore */
  }
}

export function advanceOperateNavUnlockToAnalysis(): void {
  writeOperateNavUnlockPhase(1);
}

export function advanceOperateNavUnlockToGovernance(): void {
  writeOperateNavUnlockPhase(2);
}

export function filterNavLinksByOperateUnlockPhase<T extends { href: string }>(
  links: readonly T[],
  _hasCommittedArchitectureReview: boolean,
  unlockPhase: OperateNavUnlockPhase,
): T[] {
  if (unlockPhase === 0) {
    return [];
  }

  const filtered = links.filter((link) => !NAV_CONSOLIDATED_OMIT_HREFS.has(link.href.split("?")[0] ?? ""));

  if (unlockPhase >= 2) {
    return filtered;
  }

  return filtered.filter((link) => !GOVERNANCE_PHASE_HREFS.has(link.href.split("?")[0] ?? ""));
}
