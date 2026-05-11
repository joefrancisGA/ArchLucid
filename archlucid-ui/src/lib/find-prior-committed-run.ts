import type { RunSummary } from "@/types/authority";

/** Matches another row when demo-canonical slugs equal case-insensitively. */
export function runSummaryMatchesRunId(row: RunSummary, runId: string): boolean {
  const a = row.runId.trim().toLowerCase();
  const b = runId.trim().toLowerCase();

  return a.length > 0 && a === b;
}

/**
 * Run list from GET /projects/{id}/runs is newest-first (`CreatedUtc DESC`).
 * Returns the first older row that already has a golden manifest (committed), if any.
 */
export function findPriorCommittedRun(
  currentRunId: string,
  runs: readonly RunSummary[],
): RunSummary | null {
  const idx = runs.findIndex((row) => runSummaryMatchesRunId(row, currentRunId));

  if (idx < 0) {
    return null;
  }

  for (let i = idx + 1; i < runs.length; i++) {
    const row = runs[i];

    if (row !== undefined && row.hasGoldenManifest === true) {
      return row;
    }
  }

  return null;
}
