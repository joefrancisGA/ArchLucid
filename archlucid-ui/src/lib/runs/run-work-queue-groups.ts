import type { RunSummary } from "@/types/authority";

import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { runWorkQueueAttentionPartition } from "@/lib/operator/attention-partitions";

/** Queue slice derived only from {@link RunSummary} snapshot flags (no extra API fields). */
export type RunWorkQueueGroupId =
  | "needs-attention"
  | "in-progress"
  | "committed"
  | "snapshot-flags-not-stored";

const GROUP_ORDER: RunWorkQueueGroupId[] = [
  "snapshot-flags-not-stored",
  "needs-attention",
  "in-progress",
  "committed",
];

export const RUN_WORK_QUEUE_SNAPSHOT_FLAGS_NOT_STORED_HEADING = "Snapshot flags were not stored." as const;

/** True when the list DTO omitted every pipeline snapshot flag (do not bucket as in-progress). */
export function runWorkQueueSnapshotFlagsStored(run: RunSummary): boolean {
  return (
    run.hasContextSnapshot !== undefined ||
    run.hasGraphSnapshot !== undefined ||
    run.hasFindingsSnapshot !== undefined ||
    run.hasGoldenManifest !== undefined
  );
}

/**
 * Assigns each run to a work-queue bucket for list grouping.
 * Matches operator semantics: "Ready to finalize" runs (findings without manifest) surface under needs-attention.
 */
export function assignRunWorkQueueGroup(run: RunSummary): RunWorkQueueGroupId {
  if (!runWorkQueueSnapshotFlagsStored(run)) {
    return "snapshot-flags-not-stored";
  }

  if (run.hasGoldenManifest === true) {
    return "committed";
  }

  if (run.hasFindingsSnapshot === true) {
    return "needs-attention";
  }

  return "in-progress";
}

export type RunWorkQueueSection = {
  groupId: RunWorkQueueGroupId;
  runs: RunSummary[];
};

/**
 * Partitions a date-sorted list into ordered sections; empty sections are omitted.
 */
export function partitionRunsIntoWorkQueueSections(runs: readonly RunSummary[]): RunWorkQueueSection[] {
  const buckets: Record<RunWorkQueueGroupId, RunSummary[]> = {
    "snapshot-flags-not-stored": [],
    "needs-attention": [],
    "in-progress": [],
    committed: [],
  };

  for (const run of runs) {
    const groupId = assignRunWorkQueueGroup(run);
    buckets[groupId].push(run);
  }

  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((groupId) => ({
    groupId,
    runs: buckets[groupId],
  }));
}

export { runWorkQueueAttentionPartition };

export function workQueueSectionHeading(
  groupId: RunWorkQueueGroupId,
  buyerLabelsActive: boolean = isBuyerVocabularyPassActive(),
): string {
  if (buyerLabelsActive) {
    switch (groupId) {
      case "snapshot-flags-not-stored":
        return RUN_WORK_QUEUE_SNAPSHOT_FLAGS_NOT_STORED_HEADING;

      case "needs-attention":
        return "Needs attention";

      case "in-progress":
        return "In progress";

      case "committed":
        return "Finalized";

      default: {
        const _exhaustive: never = groupId;

        return _exhaustive;
      }
    }
  }

  switch (groupId) {
    case "snapshot-flags-not-stored":
      return RUN_WORK_QUEUE_SNAPSHOT_FLAGS_NOT_STORED_HEADING;
    case "needs-attention":
      return "Needs attention";
    case "in-progress":
      return "In progress";
    case "committed":
      return "Finalized";
    default: {
      const _exhaustive: never = groupId;
      return _exhaustive;
    }
  }
}
