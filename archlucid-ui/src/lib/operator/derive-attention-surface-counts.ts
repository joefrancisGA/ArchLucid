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
    const sections = partitionRunsIntoWorkQueueSections(input.runs);

    for (const section of sections) {
      switch (section.groupId) {
        case "needs-attention":
          counts["run-work-queue-needs-attention"] = section.runs.length;
          break;

        case "in-progress":
          counts["run-work-queue-in-progress"] = section.runs.length;
          break;

        case "committed":
          counts["run-work-queue-committed"] = section.runs.length;
          break;

        default: {
          const unreachable: never = section.groupId;
          throw new Error(`Unhandled run work queue group ${unreachable}.`);
        }
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
