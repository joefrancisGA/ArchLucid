import type { RunsDashboardTabCounts } from "@/lib/operator/run-home-status";
import {
  deriveHomePreviewTabCounts,
  filterTenantOverviewRuns,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import {
  deriveOperatorHomeWorkspaceMetrics,
  type OperatorHomeWorkspaceMetricsSnapshot,
} from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

export type HomePreviewTabCounts = RunsDashboardTabCounts & {
  readonly recentVisibleCount: number;
  readonly recentTotalCount: number;
};

export type OperatorHomeTenantCountingSnapshot = {
  readonly tenantItems: readonly RunSummary[];
  readonly metrics: OperatorHomeWorkspaceMetricsSnapshot;
  readonly previewTabCounts: HomePreviewTabCounts;
};

export type DeriveOperatorHomeTenantCountingSnapshotInput = {
  readonly displayItems: readonly RunSummary[];
  readonly previewItems: readonly RunSummary[];
  readonly excludeShowcaseRunId?: string | undefined;
  readonly awaitingApprovalCount?: number;
  readonly awaitingApprovalRunIds?: readonly string[];
};

/** Single tenant-scoped counting contract for home strip, chips, outcome line, and tab counts. */
export function deriveOperatorHomeTenantCountingSnapshot(
  input: DeriveOperatorHomeTenantCountingSnapshotInput,
): OperatorHomeTenantCountingSnapshot {
  const tenantItems = filterTenantOverviewRuns(input.displayItems);
  const awaitingApprovalCount = input.awaitingApprovalCount ?? 0;
  const metrics = deriveOperatorHomeWorkspaceMetrics(tenantItems, tenantItems.length, awaitingApprovalCount);
  const previewTabCounts = deriveHomePreviewTabCounts({
    previewItems: tenantItems,
    excludeShowcaseRunId: input.excludeShowcaseRunId,
    awaitingApprovalRunIds: input.awaitingApprovalRunIds,
    awaitingApprovalCount,
  });

  return {
    tenantItems,
    metrics,
    previewTabCounts,
  };
}
