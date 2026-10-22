/** Canonical step-progress copy and math shared by every first-review / setup progress surface. */

/** `"2 of 7 steps complete"` — the emphasized fact on progress surfaces. */
export function formatStepProgressCompleteLabel(completedCount: number, totalCount: number): string {
  return `${completedCount} of ${totalCount} steps complete`;
}

/** Whole-percent fill for a step meter; clamped to 0–100 and safe when `totalCount` is 0. */
export function resolveStepProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }

  const rawPercent = Math.round((completedCount / totalCount) * 100);

  return Math.min(100, Math.max(0, rawPercent));
}
