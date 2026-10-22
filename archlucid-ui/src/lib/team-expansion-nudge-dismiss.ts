import type { TeamExpansionNudgeTrigger } from "@/lib/team-expansion-nudge-trigger";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

function dismissStorageKey(trigger: TeamExpansionNudgeTrigger): string {
  return `archlucid_team_expansion_nudge_dismiss_until_${trigger}`;
}

function sessionShownStorageKey(trigger: TeamExpansionNudgeTrigger): string {
  return `archlucid_team_expansion_nudge_session_shown_${trigger}`;
}

export function readTeamExpansionNudgeDismissUntilMs(trigger: TeamExpansionNudgeTrigger): number | null {
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

export function isTeamExpansionNudgeDismissed(
  trigger: TeamExpansionNudgeTrigger,
  nowMs: number = Date.now(),
): boolean {
  const until = readTeamExpansionNudgeDismissUntilMs(trigger);

  if (until === null) {
    return false;
  }

  return nowMs < until;
}

export function dismissTeamExpansionNudge24h(trigger: TeamExpansionNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(dismissStorageKey(trigger), String(Date.now() + TWENTY_FOUR_H_MS));
  } catch {
    /* private mode */
  }
}

export function wasTeamExpansionNudgeShownThisSession(trigger: TeamExpansionNudgeTrigger): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(sessionShownStorageKey(trigger)) === "1";
  } catch {
    return false;
  }
}

export function markTeamExpansionNudgeShownThisSession(trigger: TeamExpansionNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(sessionShownStorageKey(trigger), "1");
  } catch {
    /* private mode */
  }
}
