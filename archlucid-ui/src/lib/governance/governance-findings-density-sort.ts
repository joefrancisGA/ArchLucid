import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
  info: 4,
};

function severityRank(severity: string): number {
  const normalized = severity.trim().toLowerCase();

  return SEVERITY_RANK[normalized] ?? 99;
}

function stableRowId(row: GovernanceFindingQueueRow): string {
  return `${row.runId}:${row.findingId}`;
}

/** Working-mode default: highest signal first without dropping rows (density score when present). */
export function sortGovernanceFindingsRowsBySignal(
  rows: readonly GovernanceFindingQueueRow[],
): GovernanceFindingQueueRow[] {
  return [...rows].sort((left, right) => {
    const leftScore = left.insightDensityScore ?? -1;
    const rightScore = right.insightDensityScore ?? -1;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const severityDelta = severityRank(left.severity) - severityRank(right.severity);

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return stableRowId(left).localeCompare(stableRowId(right));
  });
}
