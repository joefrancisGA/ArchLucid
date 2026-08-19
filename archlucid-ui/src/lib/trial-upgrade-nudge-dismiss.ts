import type { TrialUpgradeNudgeTrigger } from "@/lib/trial-upgrade-nudge-trigger";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

function dismissStorageKey(trigger: TrialUpgradeNudgeTrigger): string {
  return `archlucid_trial_upgrade_nudge_dismiss_until_${trigger}`;
}

function sessionShownStorageKey(trigger: TrialUpgradeNudgeTrigger): string {
  return `archlucid_trial_upgrade_nudge_session_shown_${trigger}`;
}

export function readTrialUpgradeNudgeDismissUntilMs(trigger: TrialUpgradeNudgeTrigger): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(dismissStorageKey(trigger));

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isTrialUpgradeNudgeDismissed(
  trigger: TrialUpgradeNudgeTrigger,
  nowMs: number = Date.now(),
): boolean {
  const until = readTrialUpgradeNudgeDismissUntilMs(trigger);

  if (until === null) {
    return false;
  }

  return nowMs < until;
}

export function dismissTrialUpgradeNudge24h(trigger: TrialUpgradeNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(dismissStorageKey(trigger), String(Date.now() + TWENTY_FOUR_H_MS));
  } catch {
    /* private mode */
  }
}

export function wasTrialUpgradeNudgeShownThisSession(trigger: TrialUpgradeNudgeTrigger): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(sessionShownStorageKey(trigger)) === "1";
  } catch {
    return false;
  }
}

export function markTrialUpgradeNudgeShownThisSession(trigger: TrialUpgradeNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(sessionShownStorageKey(trigger), "1");
  } catch {
    /* private mode */
  }
}
