import type { RunSummary } from "@/types/authority";

import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

const AWAITING_DISPOSITION_RAIL_ID_PREFIX = "awaiting-disposition:";

/** Run ids already surfaced on home unfinished-work rail awaiting-disposition rows (TB-2369). */
export function listHomeAttentionPreviewExcludedRunIds(
  unfinishedRailItems: readonly UnfinishedWorkRailItem[],
): readonly string[] {
  const runIds: string[] = [];

  for (const item of unfinishedRailItems) {

    if (item.kind !== "awaiting-disposition") {
      continue;
    }

    const runId = item.id.startsWith(AWAITING_DISPOSITION_RAIL_ID_PREFIX)
      ? item.id.slice(AWAITING_DISPOSITION_RAIL_ID_PREFIX.length)
      : "";

    if (runId.length > 0) {
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
