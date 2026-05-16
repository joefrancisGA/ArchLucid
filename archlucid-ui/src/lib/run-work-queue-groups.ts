import type { RunSummary } from "@/types/authority";

/** Queue slice derived only from {@link RunSummary} snapshot flags (no extra API fields). */
export type RunWorkQueueGroupId = "needs-attention" | "in-progress" | "committed";

const GROUP_ORDER: RunWorkQueueGroupId[] = ["needs-attention", "in-progress", "committed"];

/**
 * Assigns each run to a work-queue bucket for list grouping.
 * Matches operator semantics: "Ready to finalize" runs (findings without manifest) surface under needs-attention.
 */
export function assignRunWorkQueueGroup(run: RunSummary): RunWorkQueueGroupId {
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
export function partitionRunsIntoWorkQueueSections(runs: RunSummary[]): RunWorkQueueSection[] {
  const buckets: Record<RunWorkQueueGroupId, RunSummary[]> = {
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

export function workQueueSectionHeading(groupId: RunWorkQueueGroupId, buyerPolished = false): string {
  if (buyerPolished) {
    switch (groupId) {
      case "needs-attention":
        return "Pre-final — manifest pending";
      case "in-progress":
        return "Early pipeline";
      case "committed":
        return "Finalized review packages";
      default: {
        const _exhaustive: never = groupId;
        return _exhaustive;
      }
    }
  }

  switch (groupId) {
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
