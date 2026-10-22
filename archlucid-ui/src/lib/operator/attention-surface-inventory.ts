/**
 * TB-2369 — Attention surface inventory across home, nav badges, and work queues.
 *
 * Partition ids align with `operator-attention-taxonomy.ts` and `attention-partitions.ts`.
 */

import {
  ATTENTION_PARTITION_SURFACE_MAP,
  type AttentionPartition,
  type AttentionPartitionSurfaceId,
} from "@/lib/operator/attention-partitions";
import {
  OPERATOR_ATTENTION_SURFACE_KIND_MAP,
  type OperatorAttentionSurfaceId,
} from "@/lib/operator/operator-attention-taxonomy";

export type AttentionSurfaceInventoryEntry = {
  readonly surfaceId: AttentionPartitionSurfaceId | OperatorAttentionSurfaceId;
  readonly partition: AttentionPartition;
  readonly componentPath: string;
  readonly testId: string | null;
  readonly notes: string;
};

const PARTITION_SURFACE_ENTRIES: readonly AttentionSurfaceInventoryEntry[] = [
  {
    surfaceId: "unfinished-work-rail",
    partition: "unfinished-work",
    componentPath: "components/operator-home/UnfinishedWorkRail.tsx",
    testId: "unfinished-work-rail",
    notes: "Operator home cross-session continue rail.",
  },
  {
    surfaceId: "run-work-queue-needs-attention",
    partition: "unfinished-work",
    componentPath: "app/(operator)/architecture/reviews/RunsListClient.tsx",
    testId: "runs-queue-needs-attention",
    notes: "Reviews list work-queue section heading id.",
  },
  {
    surfaceId: "run-work-queue-in-progress",
    partition: "unfinished-work",
    componentPath: "app/(operator)/architecture/reviews/RunsListClient.tsx",
    testId: "runs-queue-in-progress",
    notes: "Reviews list work-queue section heading id.",
  },
  {
    surfaceId: "run-work-queue-committed",
    partition: "awaiting-approval",
    componentPath: "app/(operator)/architecture/reviews/RunsListClient.tsx",
    testId: "runs-queue-committed",
    notes: "Finalized runs grouped under awaiting-approval partition.",
  },
  {
    surfaceId: "governance-awaiting-nav-badge",
    partition: "awaiting-approval",
    componentPath: "components/governance/GovernanceReviewsAwaitingNavBadge.tsx",
    testId: "governance-awaiting-action-nav-badge",
    notes: "Governance nav reviews awaiting action count.",
  },
  {
    surfaceId: "assigned-to-me-findings",
    partition: "assigned-to-me",
    componentPath: "components/governance/findings/GovernanceAssignedToMeFindingsNavBadge.tsx",
    testId: "governance-assigned-to-me-nav-badge",
    notes: "Shell-status projection for assigned findings count.",
  },
  {
    surfaceId: "alerts-nav",
    partition: "alerts",
    componentPath: "components/alerts/AlertsOutstandingNavBadge.tsx",
    testId: "alerts-outstanding-nav-badge",
    notes: "Alerts inbox open count beside nav.",
  },
];

const TAXONOMY_ONLY_SURFACE_ENTRIES: readonly AttentionSurfaceInventoryEntry[] = [
  {
    surfaceId: "stickiness-cockpit",
    partition: "unfinished-work",
    componentPath: "components/operator-home/OperatorHomeStickinessCockpit.tsx",
    testId: "operator-home-stickiness-cockpit",
    notes: "Repeat-usage snapshot on home — taxonomy surface; metrics out of scope for TB-2191.",
  },
  {
    surfaceId: "notifications-nav",
    partition: "alerts",
    componentPath: "components/sidebar-nav/SidebarNavCluster.tsx",
    testId: null,
    notes: "Taxonomy alias for alerts partition — no dedicated count badge.",
  },
  {
    surfaceId: "digests-nav",
    partition: "alerts",
    componentPath: "components/sidebar-nav/SidebarNavCluster.tsx",
    testId: null,
    notes: "Taxonomy alias for alerts partition — no dedicated count badge.",
  },
];

export const ATTENTION_SURFACE_INVENTORY: readonly AttentionSurfaceInventoryEntry[] = [
  ...PARTITION_SURFACE_ENTRIES,
  ...TAXONOMY_ONLY_SURFACE_ENTRIES,
];

export function listAttentionSurfaceInventoryEntries(): readonly AttentionSurfaceInventoryEntry[] {
  return ATTENTION_SURFACE_INVENTORY;
}

export function attentionSurfaceInventoryPartitionMap(): Record<string, AttentionPartition> {
  const map: Record<string, AttentionPartition> = {
    ...ATTENTION_PARTITION_SURFACE_MAP,
  };

  for (const entry of TAXONOMY_ONLY_SURFACE_ENTRIES) {
    map[entry.surfaceId] = entry.partition;
  }

  return map;
}

export function assertAttentionSurfaceInventoryCoversTaxonomy(): void {
  for (const surfaceId of Object.keys(OPERATOR_ATTENTION_SURFACE_KIND_MAP) as OperatorAttentionSurfaceId[]) {
    const partition = attentionSurfaceInventoryPartitionMap()[surfaceId];
    const taxonomyPartition = OPERATOR_ATTENTION_SURFACE_KIND_MAP[surfaceId];

    if (partition === undefined) {
      throw new Error(`Attention inventory missing taxonomy surface ${surfaceId}.`);
    }

    if (partition !== taxonomyPartition) {
      throw new Error(
        `Attention inventory partition mismatch for ${surfaceId}: inventory=${partition}, taxonomy=${taxonomyPartition}.`,
      );
    }
  }
}
