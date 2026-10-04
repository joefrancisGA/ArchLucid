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
