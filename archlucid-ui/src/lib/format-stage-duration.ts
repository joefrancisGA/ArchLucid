export const PIPELINE_STAGE_RECORDED_DURATION_SCOPE_LINE =
  "Recorded stage time from the authority pipeline — not end-to-end wall-clock for the review." as const;

/** Formats authority pipeline stage duration for operator run detail (TB-250). */
export function formatStageDurationMs(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined) {
    return "Duration not returned";
  }

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "Duration not usable";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}
