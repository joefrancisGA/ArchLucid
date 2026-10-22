import type { PresentedReadinessRow } from "@/lib/health-readiness-presentation";

/** Probes that reported a healthy result. */
export function healthyRowCount(rows: readonly PresentedReadinessRow[]): number {
  return rows.filter((row) => row.severity === "healthy").length;
}

/** Compact "N of M passing" cell copy — replaces the "all healthy" accordion summary line. */
export function healthGroupCountLabel(rows: readonly PresentedReadinessRow[]): string {
  if (rows.length === 0) {
    return "No checks reported";
  }

  return `${healthyRowCount(rows)} of ${rows.length} passing`;
}

/**
 * Slowest probe in the group. Probe duration is the only latency signal the readiness
 * payload carries, so it is surfaced on the group row instead of behind two disclosures.
 */
export function slowestProbeMs(rows: readonly PresentedReadinessRow[]): number | null {
  const durations = rows
    .map((row) => row.durationMs)
    .filter((durationMs): durationMs is number => durationMs !== null);

  if (durations.length === 0) {
    return null;
  }

  return Math.max(...durations);
}

export function formatProbeDuration(durationMs: number | null): string {
  if (durationMs === null) {
    return "Not reported";
  }

  return `${durationMs} ms`;
}

/**
 * Display status for a group row: the worst individual check, so the group chip keeps the
 * failing/degraded palette instead of collapsing to a generic aggregate word.
 */
export function worstRowDisplayStatus(rows: readonly PresentedReadinessRow[]): string {
  const ranked = [...rows].sort(
    (left, right) => severityWeight(right.severity) - severityWeight(left.severity),
  );

  return ranked[0]?.displayStatus ?? "Unknown";
}

function severityWeight(severity: PresentedReadinessRow["severity"]): number {
  const weights: Readonly<Record<PresentedReadinessRow["severity"], number>> = {
    failing: 5,
    degraded: 4,
    advisory: 3,
    unknown: 2,
    "not-configured": 1,
    healthy: 0,
  };

  return weights[severity];
}
