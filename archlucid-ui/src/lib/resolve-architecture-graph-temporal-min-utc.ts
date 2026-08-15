import type { RunSummary } from "@/types/authority";

/**
 * Earliest graph snapshot time usable for temporal browsing on the active review.
 * Only considers project runs at or before the active review {@paramref anchorCreatedUtc} so older
 * reviews are not clipped by newer graph snapshots outside the recent-run window.
 */
export function resolveArchitectureGraphTemporalMinUtc(
  anchorCreatedUtc: string,
  projectRuns: readonly RunSummary[],
): string {
  const anchor = anchorCreatedUtc.trim();

  if (anchor.length === 0) {
    return anchorCreatedUtc;
  }

  let minUtc: string | null = null;

  for (const run of projectRuns) {
    if (run.hasGraphSnapshot !== true) {
      continue;
    }

    const createdUtc = run.createdUtc.trim();

    if (createdUtc.length === 0) {
      continue;
    }

    if (createdUtc > anchor) {
      continue;
    }

    if (minUtc === null || createdUtc < minUtc) {
      minUtc = createdUtc;
    }
  }

  if (minUtc === null) {
    return anchor;
  }

  return minUtc;
}
