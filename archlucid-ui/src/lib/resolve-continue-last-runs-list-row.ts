import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { RunSummary } from "@/types/authority";

const REVIEW_PATH_PREFIX = "/architecture/reviews/";

function runIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(REVIEW_PATH_PREFIX)) {
    return null;
  }

  const remainder = path.slice(REVIEW_PATH_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function readRecentReviewRunId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const runId = runIdFromRecentHref(entry.href);

      if (runId !== null) {
        return runId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the review row to pin as Continue last viewed on the reviews list. */
export function resolveContinueLastRunsListRow(runs: readonly RunSummary[]): RunSummary | null {
  if (runs.length === 0) {
    return null;
  }

  const recentRunId = readRecentReviewRunId();

  if (recentRunId !== null) {
    const recentMatch = runs.find((run) => run.runId === recentRunId);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  return (
    runs
      .slice()
      .sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0] ?? null
  );
}
