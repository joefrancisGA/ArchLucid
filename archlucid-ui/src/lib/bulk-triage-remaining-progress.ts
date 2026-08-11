/**
 * Source of truth for bulk-triage remaining progress copy (TB-2213).
 * Surfaces a finite finish line: "{open} of {total} left".
 */

export type BulkTriageRemainingProgressInput = {
  readonly openCount: number;
  readonly totalInView: number;
};

export type BulkTriageRemainingProgress = {
  /** Remaining open findings in the current triage view. */
  readonly openCount: number;
  /** Total findings currently in view (denominator / finish line). */
  readonly totalInView: number;
  /** Operator-facing chip label, e.g. "3 of 12 left". */
  readonly label: string;
  /** True when the view has items to show progress against. */
  readonly visible: boolean;
  /** True when the view has items and none remain open. */
  readonly complete: boolean;
};

function normalizeNonNegativeCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

/** Builds normalized counts and the "{open} of {total} left" chip label. */
export function buildBulkTriageRemainingProgress(
  input: BulkTriageRemainingProgressInput,
): BulkTriageRemainingProgress {
  const totalInView = normalizeNonNegativeCount(input.totalInView);
  const openRaw = normalizeNonNegativeCount(input.openCount);
  const openCount = Math.min(openRaw, totalInView);

  return {
    openCount,
    totalInView,
    label: `${openCount} of ${totalInView} left`,
    visible: totalInView > 0,
    complete: totalInView > 0 && openCount === 0,
  };
}