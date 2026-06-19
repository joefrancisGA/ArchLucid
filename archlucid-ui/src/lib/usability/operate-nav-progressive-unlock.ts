/**
 * Progressive Operate nav unlock: analysis first after first commit, governance after phase 2.
 */

export type OperateNavUnlockPhase = 1 | 2;

export const OPERATE_NAV_UNLOCK_STORAGE_KEY = "archlucid.operateNavUnlockPhase.v1";

/** Hrefs hidden until phase 2 (governance cluster). Recurrence schedules stay in phase 1 — operating rhythm, not deep governance. */
const GOVERNANCE_PHASE_HREFS = new Set<string>([
  "/alerts",
  "/policy-packs",
  "/governance-resolution",
  "/governance",
  "/audit",
  "/governance/decision-register",
  "/governance/first-30-days",
  "/workspace/security-trust",
  "/integrations/teams",
  "/value-report",
]);

/** Duplicate/near-duplicate routes hidden from primary nav (deep links still work). */
const NAV_CONSOLIDATED_OMIT_HREFS = new Set<string>([
  "/governance/dashboard",
  "/value-report/pilot",
  "/value-report/roi",
  "/digests",
  "/digest-subscriptions",
]);

export function readOperateNavUnlockPhase(): OperateNavUnlockPhase {
  if (typeof window === "undefined") {
    return 1;
  }

  try {
    const raw = window.localStorage.getItem(OPERATE_NAV_UNLOCK_STORAGE_KEY);

    if (raw === "2") {
      return 2;
    }
  }
  catch {
    /* ignore */
  }

  return 1;
}

export function writeOperateNavUnlockPhase(phase: OperateNavUnlockPhase): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(OPERATE_NAV_UNLOCK_STORAGE_KEY, String(phase));
  }
  catch {
    /* ignore */
  }
}

export function advanceOperateNavUnlockToGovernance(): void {
  writeOperateNavUnlockPhase(2);
}

export function filterNavLinksByOperateUnlockPhase<T extends { href: string }>(
  links: readonly T[],
  hasCommittedArchitectureReview: boolean,
  unlockPhase: OperateNavUnlockPhase,
): T[] {
  const filtered = links.filter((link) => !NAV_CONSOLIDATED_OMIT_HREFS.has(link.href.split("?")[0] ?? ""));

  if (!hasCommittedArchitectureReview) {
    return filtered;
  }

  if (unlockPhase >= 2) {
    return filtered;
  }

  return filtered.filter((link) => !GOVERNANCE_PHASE_HREFS.has(link.href.split("?")[0] ?? ""));
}
