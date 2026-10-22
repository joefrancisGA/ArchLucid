import type { RunSummary } from "@/types/authority";

/** Matches recent-deltas committed filter — list rows carry `currentManifestVersion` when finalized. */
export function isCommittedRunSummary(summary: RunSummary): boolean {
  const version = summary.currentManifestVersion?.trim() ?? "";

  if (version.length > 0) {
    return true;
  }

  const golden = summary.goldenManifestId;

  if (golden === null || golden === undefined) {
    return false;
  }

  return String(golden).trim().length > 0;
}

function committedOrderingUtc(summary: RunSummary): number {
  const completed = summary.completedUtc?.trim() ?? "";
  const created = summary.createdUtc?.trim() ?? "";
  const raw = completed.length > 0 ? completed : created;

  return Date.parse(raw);
}

/**
 * Picks the most recent prior committed run for the same architecture request as **`current`**,
 * using list summary timestamps when the recent-deltas window does not include the prior finalization.
 */
export function pickPriorForSameRequestFromRunSummaries(
  current: RunSummary,
  rows: readonly RunSummary[],
): RunSummary | null {
  if (!isCommittedRunSummary(current)) {
    return null;
  }

  const requestId = current.requestId?.trim() ?? "";

  if (requestId.length === 0) {
    return null;
  }

  const currentCommittedAt = committedOrderingUtc(current);

  if (Number.isNaN(currentCommittedAt)) {
    return null;
  }

  const candidates = rows.filter((row) => {
    if (row.runId === current.runId) {
      return false;
    }

    if ((row.requestId?.trim() ?? "") !== requestId) {
      return false;
    }

    if (!isCommittedRunSummary(row)) {
      return false;
    }

    const committedAt = committedOrderingUtc(row);

    if (Number.isNaN(committedAt)) {
      return false;
    }

    return committedAt < currentCommittedAt;
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((latest, row) => {
    const latestAt = committedOrderingUtc(latest);
    const rowAt = committedOrderingUtc(row);

    return rowAt > latestAt ? row : latest;
  });
}
