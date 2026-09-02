"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useSampleReviewsOnOverviewVisible } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { filterRunsForHomeAttentionPreview } from "@/lib/operator/home-attention-dedup";
import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import {
  deriveRunsDashboardTabCounts,
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  isRunNeedingAttention,
  resolveShowcaseDemoRunForItems,
  runIsShowcaseHomeExampleStory,
  runSummaryHasArchivedField,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase, RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import {
  homeGovernanceWarningsQueryEnabled,
  resolveRunsDashboardOpenAllReviewsHref,
  resolveRunsDashboardRecentListTab,
  resolveRunsDashboardStatusTabIds,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import {
  getBuyerSafeReviewsTableLink,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer/buyer-safe-review-navigation";
import {
  filterTenantOverviewRuns,
  formatOperatorHomeRecentReviewsOutcome,
  isExampleOnlyOverviewRunList,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import { shouldShowRunsDashboardInitialSkeleton } from "@/lib/operator/operator-home-runs-dashboard-client-fetch";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

export type UseRunsDashboardTabsOptions = {
  readonly hideHeading?: boolean;
  readonly buyerPolishedShell: boolean;
  readonly projectId: string;
  readonly phase: RunsDashboardLoadPhase;
  readonly failure: ApiLoadFailureState | null;
  readonly effectiveItems: RunSummary[];
  readonly loadedTotalCount: number;
  readonly onRestoreArchived?: () => void;
  readonly restoreArchivedRequest: (requestId: string, onRestored?: () => void) => Promise<void>;
};

export function useRunsDashboardTabs({
  hideHeading = false,
  buyerPolishedShell,
  projectId,
  phase,
  failure,
  effectiveItems,
  loadedTotalCount,
  onRestoreArchived,
  restoreArchivedRequest,
}: UseRunsDashboardTabsOptions) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<RunsDashboardTabId>("all");
  const [governanceWarningsOnly, setGovernanceWarningsOnly] = useState(() =>
    homeGovernanceWarningsQueryEnabled(searchParams),
  );
  const [showArchived, setShowArchived] = useState(false);
  const { reportWorkspaceReviews, homeAttentionPreviewExcludedRunIds } = useOperatorHomeWorkspaceActivity();
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();

  useEffect(() => {
    if (homeGovernanceWarningsQueryEnabled(searchParams)) {
      setGovernanceWarningsOnly(true);
      setTab("all");
    }
  }, [searchParams]);

  const displayItems = useMemo(() => {
    if (hideHeading && !sampleReviewsVisible) {
      return filterTenantOverviewRuns(effectiveItems);
    }

    return effectiveItems;
  }, [effectiveItems, hideHeading, sampleReviewsVisible]);

  const archivedFieldSupported = useMemo(
    () => displayItems.some(runSummaryHasArchivedField),
    [displayItems],
  );

  const archivedCount = useMemo(() => {
    if (!archivedFieldSupported) {
      return 0;
    }

    return displayItems.filter((run) => run.isArchived === true).length;
  }, [archivedFieldSupported, displayItems]);

  const archivedFilterDisabled = !archivedFieldSupported || archivedCount === 0;

  useEffect(() => {
    if (archivedFilterDisabled && showArchived) {
      setShowArchived(false);
    }
  }, [archivedFilterDisabled, showArchived]);

  const filteredItems = useMemo(() => {
    let rows = displayItems;

    if (showArchived) {
      if (archivedFieldSupported) {
        rows = rows.filter((run) => run.isArchived === true);
      }
    } else {
      rows = rows.filter((run) => run.isArchived !== true);
    }

    if (governanceWarningsOnly) {
      rows = rows.filter((run) => run.hasGovernanceWarnings === true);
    }

    return rows;
  }, [archivedFieldSupported, displayItems, governanceWarningsOnly, showArchived]);

  const showcaseDemoRun = useMemo(
    () => filteredItems.find((run) => runIsShowcaseHomeExampleStory(run)),
    [filteredItems],
  );

  const buyerSafeHighlight =
    showcaseDemoRun !== undefined && isBuyerSafePrimaryReviewNavigationPreferred(showcaseDemoRun.runId);

  const showcasePrimaryCta =
    showcaseDemoRun !== undefined ? getBuyerSafeReviewsTableLink(showcaseDemoRun.runId) : null;

  const approvedTabItems = useMemo(
    () => filteredItems.filter(isRunApprovedPackage),
    [filteredItems],
  );

  const monitoringTabItems = useMemo(
    () => filteredItems.filter(isRunApprovedWithMonitoringPackage),
    [filteredItems],
  );

  const attentionTabItems = useMemo(
    () => filteredItems.filter(isRunNeedingAttention),
    [filteredItems],
  );

  const homeAttentionPreviewItems = useMemo(() => {
    if (!hideHeading) {
      return filteredItems;
    }

    return filterRunsForHomeAttentionPreview(filteredItems, homeAttentionPreviewExcludedRunIds);
  }, [filteredItems, hideHeading, homeAttentionPreviewExcludedRunIds]);

  const homeAttentionPartitionLabel = hideHeading ? operatorAttentionKindLabel("unfinished-work") : undefined;

  const statusTabCounts = useMemo(() => deriveRunsDashboardTabCounts(filteredItems), [filteredItems]);

  const allTabShowcase = resolveShowcaseDemoRunForItems(filteredItems, showcaseDemoRun);
  const approvedTabShowcase = resolveShowcaseDemoRunForItems(approvedTabItems, showcaseDemoRun);
  const attentionTabShowcase = resolveShowcaseDemoRunForItems(attentionTabItems, showcaseDemoRun);
  const monitoringTabShowcase = resolveShowcaseDemoRunForItems(monitoringTabItems, showcaseDemoRun);

  const runListError = phase === "error" && failure !== null && effectiveItems.length === 0;
  const showInitialLoadingSkeleton = shouldShowRunsDashboardInitialSkeleton(phase, effectiveItems.length);
  const showReviewFilters =
    effectiveItems.length > 0 && (phase === "ready" || phase === "error");

  useEffect(() => {
    if (phase === "ready" || phase === "error") {
      reportWorkspaceReviews(effectiveItems, Math.max(loadedTotalCount, effectiveItems.length));
    }
  }, [effectiveItems, loadedTotalCount, phase, reportWorkspaceReviews]);

  const openAllReviewsHref = resolveRunsDashboardOpenAllReviewsHref(projectId);
  const statusTabIds = resolveRunsDashboardStatusTabIds(buyerPolishedShell, statusTabCounts);
  const isRecentListTab = resolveRunsDashboardRecentListTab(tab, buyerPolishedShell);

  const recentReviewsOutcomeLine = useMemo(() => {
    if (phase !== "ready" && phase !== "error") {
      return null;
    }

    const exampleReviewOnly = hideHeading && !sampleReviewsVisible
      ? false
      : isExampleOnlyOverviewRunList(displayItems);
    const tenantItems = filterTenantOverviewRuns(displayItems);
    const metrics = deriveOperatorHomeWorkspaceMetrics(tenantItems, tenantItems.length);

    return formatOperatorHomeRecentReviewsOutcome(metrics, { exampleReviewOnly });
  }, [displayItems, hideHeading, phase, sampleReviewsVisible]);

  const selectDashboardTab = useCallback((next: RunsDashboardTabId) => {
    setTab(next);
    setShowArchived(false);
  }, []);

  const handleRestoreArchivedRequest = useCallback(
    async (requestId: string) => {
      await restoreArchivedRequest(requestId, () => {
        setShowArchived(false);
        onRestoreArchived?.();
      });
    },
    [onRestoreArchived, restoreArchivedRequest],
  );

  return {
    tab,
    governanceWarningsOnly,
    setGovernanceWarningsOnly,
    showArchived,
    setShowArchived,
    displayItems,
    filteredItems,
    approvedTabItems,
    attentionTabItems,
    monitoringTabItems,
    homeAttentionPreviewItems,
    homeAttentionPartitionLabel,
    statusTabCounts,
    allTabShowcase,
    approvedTabShowcase,
    attentionTabShowcase,
    monitoringTabShowcase,
    showcaseDemoRun,
    showcasePrimaryCta,
    buyerSafeHighlight,
    archivedFieldSupported,
    runListError,
    showInitialLoadingSkeleton,
    showReviewFilters,
    openAllReviewsHref,
    statusTabIds,
    isRecentListTab,
    recentReviewsOutcomeLine,
    archivedCount,
    archivedFilterDisabled,
    selectDashboardTab,
    restoreArchivedRequest: handleRestoreArchivedRequest,
  };
}
