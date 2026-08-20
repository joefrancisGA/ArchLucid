import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";
import type { RunWorkQueueGroupId } from "@/lib/runs/run-work-queue-groups";

export type AttentionPartition = OperatorAttentionKindId;

export type AttentionPartitionSurfaceId =
  | "unfinished-work-rail"
  | "run-work-queue-needs-attention"
  | "run-work-queue-in-progress"
  | "run-work-queue-committed"
  | "governance-awaiting-nav-badge"
  | "assigned-to-me-findings"
  | "alerts-nav";

export const ATTENTION_PARTITION_SURFACE_MAP: Record<AttentionPartitionSurfaceId, AttentionPartition> = {
  "unfinished-work-rail": "unfinished-work",
  "run-work-queue-needs-attention": "unfinished-work",
  "run-work-queue-in-progress": "unfinished-work",
  "run-work-queue-committed": "awaiting-approval",
  "governance-awaiting-nav-badge": "awaiting-approval",
  "assigned-to-me-findings": "assigned-to-me",
  "alerts-nav": "alerts",
};

/** Maps run work-queue buckets to attention partitions (TB-2369). */
export function runWorkQueueAttentionPartition(groupId: RunWorkQueueGroupId): AttentionPartition {
  switch (groupId) {
    case "needs-attention":
      return "unfinished-work";

    case "in-progress":
      return "unfinished-work";

    case "committed":
      return "awaiting-approval";

    default: {
      const unreachable: never = groupId;
      throw new Error(`Unhandled run work queue group ${unreachable}.`);
    }
  }
}

export function attentionPartitionInventory(): readonly {
  readonly surfaceId: AttentionPartitionSurfaceId;
  readonly partition: AttentionPartition;
}[] {
  return (Object.entries(ATTENTION_PARTITION_SURFACE_MAP) as Array<
    [AttentionPartitionSurfaceId, AttentionPartition]
  >).map(([surfaceId, partition]) => ({
    surfaceId,
    partition,
  }));
}
