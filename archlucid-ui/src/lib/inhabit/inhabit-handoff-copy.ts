/** IH-022 — spawn-lock handoff continues inhabited findings on this architecture. */

export const INHABIT_SPAWN_LOCK_HANDOFF_CONTINUE_FINDINGS_LABEL = "Continue findings on this architecture" as const;

export function formatInhabitSpawnLockHandoffContinueLabel(reviewLabel: string): string {
  const trimmed = reviewLabel.trim();

  if (trimmed.length === 0) {
    return INHABIT_SPAWN_LOCK_HANDOFF_CONTINUE_FINDINGS_LABEL;
  }

  return `${INHABIT_SPAWN_LOCK_HANDOFF_CONTINUE_FINDINGS_LABEL} — ${trimmed}`;
}
