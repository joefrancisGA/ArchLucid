import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { RunSummary } from "@/types/authority";

const REVIEW_PATH_PREFIX = "/architecture/reviews/";

export type ContinueLastReviewPackageTarget = {
  readonly runId: string;
  readonly label: string;
  readonly href: string;
  readonly visitedAtUtc: string;
};

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

function readRecentReviewPackageEntry(): ContinueLastReviewPackageTarget | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      if (entry.kind !== "review") {
        continue;
      }

      const runId = runIdFromRecentHref(entry.href);

      if (runId === null) {
        continue;
      }

      return {
        runId,
        label: entry.label,
        href: entry.href,
        visitedAtUtc: entry.visitedAtUtc,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the review package to pin on Working Overview (CD-11). */
export function resolveContinueLastReviewPackageTarget(
  runs: readonly RunSummary[],
): ContinueLastReviewPackageTarget | null {
  const recent = readRecentReviewPackageEntry();

  if (recent === null) {
    return null;
  }

  const accessible = runs.some((run) => run.runId === recent.runId);

  if (!accessible) {
    return null;
  }

  return recent;
}
