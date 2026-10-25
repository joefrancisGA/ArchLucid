import {
  normalizeOperatorHomeNonNegativeCount,
  type RunsDashboardTabCounts,
} from "@/lib/operator/run-home-status";
import {
  deriveHomePreviewTabCounts,
  filterTenantOverviewRuns,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import { resolveOperatorHomeRunsPanelReportedTotalCount } from "@/lib/operator/operator-home-live-runs-dashboard";
import {
  deriveOperatorHomeWorkspaceMetricsFromOverviewRuns,
  type OperatorHomeWorkspaceMetricsSnapshot,
} from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

function resolveTenantCountingRunsDashboardTotal(
  displayItems: readonly RunSummary[],
  runsDashboardTotalCount?: number,
): number | undefined {
  if (runsDashboardTotalCount === undefined) {
    return undefined;
  }

  return resolveOperatorHomeRunsPanelReportedTotalCount(displayItems, runsDashboardTotalCount);
}

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
  readonly runsDashboardTotalCount?: number;
  readonly excludeShowcaseRunId?: string | undefined;
  readonly awaitingApprovalCount?: number;
  readonly awaitingApprovalRunIds?: readonly string[];
};

/** Single tenant-scoped counting contract for home strip, chips, outcome line, and tab counts. */
export function deriveOperatorHomeTenantCountingSnapshot(
  input: DeriveOperatorHomeTenantCountingSnapshotInput,
): OperatorHomeTenantCountingSnapshot {
  const tenantItems = filterTenantOverviewRuns(input.displayItems);
  const previewTenantItems = filterTenantOverviewRuns(input.previewItems);
  const awaitingApprovalCount = normalizeOperatorHomeNonNegativeCount(input.awaitingApprovalCount);
  const metrics = deriveOperatorHomeWorkspaceMetricsFromOverviewRuns(
    input.displayItems,
    resolveTenantCountingRunsDashboardTotal(input.displayItems, input.runsDashboardTotalCount),
    awaitingApprovalCount,
  );
  const previewTabCounts = deriveHomePreviewTabCounts({
    previewItems: previewTenantItems,
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
