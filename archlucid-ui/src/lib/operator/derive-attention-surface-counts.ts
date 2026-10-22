import { reviewsHubNeedsAttention } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-review-status";
import type { SummarizeAttentionSurfacesInput } from "@/lib/operator/attention-summary";
import { partitionRunsIntoWorkQueueSections } from "@/lib/runs/run-work-queue-groups";
import type { RunSummary } from "@/types/authority";

export type DeriveAttentionSurfaceCountsInput = {
  readonly unfinishedWorkRailCount?: number;
  readonly runs?: readonly RunSummary[];
  readonly assignedToMeFindingsCount?: number;
  readonly awaitingApprovalCount?: number;
  readonly alertsOpenCount?: number;
};

function normalizeOptionalCount(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.trunc(value));
}

/** Maps live operator inputs to inventoried attention surface counts (TB-2369). */
export function deriveAttentionSurfaceCounts(
  input: DeriveAttentionSurfaceCountsInput,
): SummarizeAttentionSurfacesInput {
  const counts: SummarizeAttentionSurfacesInput = {};
  const unfinishedWorkRailCount = normalizeOptionalCount(input.unfinishedWorkRailCount);

  if (unfinishedWorkRailCount !== undefined) {
    counts["unfinished-work-rail"] = unfinishedWorkRailCount;
  }

  if (input.runs !== undefined) {
    const activeRuns = input.runs.filter((run) => run.isArchived !== true);

    // Align unfinished-work chip count with `/architecture/reviews?filter=needs-attention`.
    counts["run-work-queue-needs-attention"] = activeRuns.filter((run) => reviewsHubNeedsAttention(run)).length;
    const sections = partitionRunsIntoWorkQueueSections(activeRuns);

    for (const section of sections) {
      if (section.groupId === "in-progress") {
        counts["run-work-queue-in-progress"] = section.runs.length;
      }

      if (section.groupId === "committed") {
        counts["run-work-queue-committed"] = section.runs.length;
      }
    }
  }

  const assignedToMeFindingsCount = normalizeOptionalCount(input.assignedToMeFindingsCount);

  if (assignedToMeFindingsCount !== undefined) {
    counts["assigned-to-me-findings"] = assignedToMeFindingsCount;
  }

  const awaitingApprovalCount = normalizeOptionalCount(input.awaitingApprovalCount);

  if (awaitingApprovalCount !== undefined) {
    counts["governance-awaiting-nav-badge"] = awaitingApprovalCount;
  }

  const alertsOpenCount = normalizeOptionalCount(input.alertsOpenCount);

  if (alertsOpenCount !== undefined) {
    counts["alerts-nav"] = alertsOpenCount;
  }

  return counts;
}
