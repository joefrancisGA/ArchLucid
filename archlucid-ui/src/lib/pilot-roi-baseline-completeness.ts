/** Positive finite hour estimate suitable for sponsor-ready ROI gates (manual prep + review-cycle anchors). */

export function coerceFinitePositiveHours(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  return n;
}

export type PilotRoiBaselineGateInputs = {
  baselineReviewCycleHours: unknown;
  manualPrepHoursPerReview: unknown;
};

/** Sponsor-ready quantitative ROI posture requires tenant-supplied review-cycle and manual-prep anchors. */

export function isPilotRoiBaselineComplete(args: PilotRoiBaselineGateInputs): boolean {
  return (
    coerceFinitePositiveHours(args.baselineReviewCycleHours) !== null &&
    coerceFinitePositiveHours(args.manualPrepHoursPerReview) !== null
  );
}
