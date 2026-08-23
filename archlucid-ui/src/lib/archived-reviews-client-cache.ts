import type { RunSummary } from "@/types/authority";

/** Browser-local cache of soft-archived reviews (list API excludes them until includeArchived ships). */
export const ARCHIVED_REVIEWS_CLIENT_CACHE_KEY = "archlucid.archivedReviewsClientCache.v1";

export const ARCHIVED_REVIEWS_CLIENT_CACHE_MAX = 200;

function normalizeRunId(runId: string): string {
  return runId.trim();
}

function isRunSummaryRow(row: unknown): row is RunSummary {
  if (row === null || typeof row !== "object") {
    return false;
  }

  const candidate = row as { runId?: unknown; projectId?: unknown; createdUtc?: unknown };

  return (
    typeof candidate.runId === "string" &&
    normalizeRunId(candidate.runId).length > 0 &&
    typeof candidate.projectId === "string" &&
    candidate.projectId.trim().length > 0 &&
    typeof candidate.createdUtc === "string" &&
    candidate.createdUtc.trim().length > 0
  );
}

function normalizeArchivedRun(run: RunSummary): RunSummary {
  return {
    ...run,
    runId: normalizeRunId(run.runId),
    isArchived: true,
  };
}

/** Reads archived review snapshots from localStorage (newest archive first). */
export function listArchivedReviewsClientCache(): RunSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ARCHIVED_REVIEWS_CLIENT_CACHE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isRunSummaryRow)
      .map(normalizeArchivedRun)
      .slice(0, ARCHIVED_REVIEWS_CLIENT_CACHE_MAX);
  } catch {
    return [];
  }
}

export function writeArchivedReviewsClientCache(runs: readonly RunSummary[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = runs
      .filter(isRunSummaryRow)
      .map(normalizeArchivedRun)
      .slice(0, ARCHIVED_REVIEWS_CLIENT_CACHE_MAX);

    window.localStorage.setItem(ARCHIVED_REVIEWS_CLIENT_CACHE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore quota / private mode */
  }
}

export function addArchivedReviewToClientCache(run: RunSummary): RunSummary[] {
  const normalized = normalizeArchivedRun(run);
  const without = listArchivedReviewsClientCache().filter((row) => row.runId !== normalized.runId);
  const next = [normalized, ...without].slice(0, ARCHIVED_REVIEWS_CLIENT_CACHE_MAX);

  writeArchivedReviewsClientCache(next);

  return next;
}
