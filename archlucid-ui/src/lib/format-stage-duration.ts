/** Formats authority pipeline stage duration for operator run detail (TB-250). */
export function formatStageDurationMs(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined) {
    return "—";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}
