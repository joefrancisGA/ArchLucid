import type { RunSummary } from "@/types/authority";

import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

const AWAITING_DISPOSITION_RAIL_ID_PREFIX = "awaiting-disposition:";
const REVIEW_IN_PROGRESS_RAIL_ID_PREFIX = "review-in-progress:";

function runIdFromUnfinishedWorkRailItem(item: UnfinishedWorkRailItem): string | null {
  if (item.kind === "awaiting-disposition") {
    const runId = item.id.startsWith(AWAITING_DISPOSITION_RAIL_ID_PREFIX)
      ? item.id.slice(AWAITING_DISPOSITION_RAIL_ID_PREFIX.length)
      : "";

    return runId.length > 0 ? runId : null;
  }

  if (item.kind === "review-in-progress") {
    const runId = item.id.startsWith(REVIEW_IN_PROGRESS_RAIL_ID_PREFIX)
      ? item.id.slice(REVIEW_IN_PROGRESS_RAIL_ID_PREFIX.length)
      : "";

    return runId.length > 0 ? runId : null;
  }

  return null;
}

/** Run ids already surfaced on home unfinished-work rail rows (TB-2369). */
export function listHomeAttentionPreviewExcludedRunIds(
  unfinishedRailItems: readonly UnfinishedWorkRailItem[],
): readonly string[] {
  const runIds: string[] = [];

  for (const item of unfinishedRailItems) {
    const runId = runIdFromUnfinishedWorkRailItem(item);

    if (runId !== null) {
      runIds.push(runId);
    }
  }

  return runIds;
}

/** Removes runs already shown on the unfinished-work rail from home attention previews. */
export function filterRunsForHomeAttentionPreview(
  runs: readonly RunSummary[],
  excludedRunIds: readonly string[],
): readonly RunSummary[] {
  if (excludedRunIds.length === 0) {
    return runs;
  }

  const excluded = new Set(excludedRunIds);

  return runs.filter((run) => {
    const runId = run.runId?.trim() ?? "";

    if (runId.length === 0) {
      return true;
    }

    return !excluded.has(runId);
  });
}
