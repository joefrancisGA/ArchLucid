import {
  trackUnlockPhaseChanged,
  type OperateNavUnlockPhaseChangeReason,
} from "@/lib/operator/operator-navigation-telemetry";

/**
 * Progressive Operate nav unlock phase (persisted for telemetry / legacy callers).
 * **Sidebar visibility no longer uses this** (owner 2026-08-03) — role/authority only.
 */

export type OperateNavUnlockPhase = 0 | 1 | 2;

export const OPERATE_NAV_UNLOCK_STORAGE_KEY = "archlucid.operateNavUnlockPhase.v1";

export const OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY = "archlucid.operateNavAutoUnlockHintPending.v1";

export const OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY = "archlucid.operateNavAutoUnlockHintDismissed.v1";

export const OPERATE_NAV_UNLOCK_CHANGED_EVENT = "archlucid-operate-nav-unlock-changed";

const OPERATE_NAV_GROUP_IDS = new Set<string>([
  "operate-analysis",
  "operate-governance",
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

export function writeOperateNavUnlockPhase(
  phase: OperateNavUnlockPhase,
  reason: OperateNavUnlockPhaseChangeReason = "persist",
): void {
  const previousPhase = readOperateNavUnlockPhase();

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

  trackUnlockPhaseChanged({
    previousPhase,
    newPhase: phase,
    reason,
  });
}

export function advanceOperateNavUnlockToAnalysis(
  reason: OperateNavUnlockPhaseChangeReason = "first-committed-review",
): void {
  writeOperateNavUnlockPhase(1, reason);
}

function readLocalStorageFlag(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "1";
  }
  catch {
    return false;
  }
}

function writeLocalStorageFlag(key: string, value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    }
    else {
      window.localStorage.removeItem(key);
    }
  }
  catch {
    /* ignore */
  }
}

/** Marks that analysis nav was auto-unlocked after the first committed review (shows sidebar hint). */
export function markOperateNavAutoUnlockHintPending(): void {
  writeLocalStorageFlag(OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY, true);
}

/** Clears a pending auto-unlock hint when the operator unlocks Operate manually. */
export function clearOperateNavAutoUnlockHintPending(): void {
  writeLocalStorageFlag(OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY, false);
}

export function shouldShowOperateNavAutoUnlockHint(): boolean {
  return readLocalStorageFlag(OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY)
    && !readLocalStorageFlag(OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY);
}

export function dismissOperateNavAutoUnlockHint(): void {
  writeLocalStorageFlag(OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY, true);
  clearOperateNavAutoUnlockHintPending();
}

export function advanceOperateNavUnlockToGovernance(
  reason: OperateNavUnlockPhaseChangeReason = "compare-visit",
): void {
  writeOperateNavUnlockPhase(2, reason);
}
