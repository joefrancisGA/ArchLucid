import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import type { RunSummary } from "@/types/authority";

const REVIEW_PATH_PREFIX = "/architecture/reviews/";

export type ContinueLastReviewPackageTarget = {
  readonly runId: string;
  readonly label: string;
  readonly href: string;
  readonly visitedAtUtc: string;
};

export type ResolveContinueLastReviewPackageOptions = {
  readonly workingMode?: boolean;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
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

function buildContinueLastReviewPackageHref(
  runId: string,
  runs: readonly RunSummary[],
  options?: ResolveContinueLastReviewPackageOptions,
): string {
  const trimmedRunId = runId.trim();
  const run = runs.find((item) => item.runId === trimmedRunId);

  if (options?.workingMode === true) {
    return resolveWorkingRunReviewLocator({
      runId: trimmedRunId,
      requestId: run?.requestId,
      draftRegistryEntries: options.draftRegistryEntries,
    }).href;
  }

  return `${REVIEW_PATH_PREFIX}${encodeURIComponent(trimmedRunId)}`;
}

function readRecentReviewPackageEntry(
  runs: readonly RunSummary[],
  options?: ResolveContinueLastReviewPackageOptions,
): ContinueLastReviewPackageTarget | null {
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
        href: buildContinueLastReviewPackageHref(runId, runs, options),
        visitedAtUtc: entry.visitedAtUtc,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the review package to pin on Working Overview (CD-11 / SY-64). */
export function resolveContinueLastReviewPackageTarget(
  runs: readonly RunSummary[],
  serverLastOpenReviewId?: string | null,
  options?: ResolveContinueLastReviewPackageOptions,
): ContinueLastReviewPackageTarget | null {
  const trimmedServerReviewId = serverLastOpenReviewId?.trim() ?? "";

  if (trimmedServerReviewId.length > 0) {
    const accessible = runs.some((run) => run.runId === trimmedServerReviewId);

    if (accessible) {
      return {
        runId: trimmedServerReviewId,
        label: "Review",
        href: buildContinueLastReviewPackageHref(trimmedServerReviewId, runs, options),
        visitedAtUtc: new Date().toISOString(),
      };
    }
  }

  const recent = readRecentReviewPackageEntry(runs, options);

  if (recent === null) {
    return null;
  }

  const accessible = runs.some((run) => run.runId === recent.runId);

  if (!accessible) {
    return null;
  }

  return recent;
}
