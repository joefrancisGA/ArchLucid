"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { useSampleReviewsOnOverviewVisible } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { filterRunsForHomeAttentionPreview } from "@/lib/operator/home-attention-dedup";
import { useGovernanceReviewsAwaitingActionQuery } from "@/hooks/use-governance-reviews-awaiting-action-query";
import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { resolveHighestNonZeroAttentionKind } from "@/lib/operator/operator-attention-chip-needs-action";
import { OPERATOR_ATTENTION_KIND_IDS } from "@/lib/operator/operator-attention-taxonomy";
import {
  deriveRunsDashboardTabCounts,
  resolveAwaitingApprovalTabItems,
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  isRunNeedingAttention,
  resolveShowcaseDemoRunForItems,
  runIsShowcaseHomeExampleStory,
  runSummaryHasArchivedField,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase, RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
  parseRunsDashboardShowArchivedFromSearch,
  parseRunsDashboardTabFromSearch,
  resolveRunsDashboardOpenAllReviewsHref,
  resolveRunsDashboardRecentListTab,
  resolveRunsDashboardStatusTabIds,
  runsDashboardHomeHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import {
  getBuyerSafeReviewsTableLink,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer/buyer-safe-review-navigation";
import {
  filterTenantOverviewRuns,
  formatOperatorHomeRecentReviewsOutcome,
  isExampleOnlyOverviewRunList,
  OPERATOR_HOME_RECENT_FEATURED_LIMIT,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { HomePreviewTabCounts } from "@/lib/operator/operator-home-tenant-counting";
import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
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
  const [tab, setTab] = useState<RunsDashboardTabId>(() => parseRunsDashboardTabFromSearch(searchParams.get("tab")));
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const [governanceWarningsOnly, setGovernanceWarningsOnly] = useState(() =>
    homeGovernanceWarningsQueryEnabled(searchParams),
  );
  const governanceWarningsOnlyRef = useRef(governanceWarningsOnly);
  governanceWarningsOnlyRef.current = governanceWarningsOnly;
  const [showArchived, setShowArchived] = useState(() =>
    parseRunsDashboardShowArchivedFromSearch(searchParams.get("archived")),
  );
  const showArchivedRef = useRef(showArchived);
  showArchivedRef.current = showArchived;
  const { reportWorkspaceReviews, homeAttentionPreviewExcludedRunIds } = useOperatorHomeWorkspaceActivity();
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();
  const { summaries: attentionSummaries } = useOperatorAttentionSummary();
  const { items: awaitingApprovalItems } = useGovernanceReviewsAwaitingActionQuery();
  const awaitingApprovalCount =
    attentionSummaries.find((summary) => summary.partition === "awaiting-approval")?.totalCount ??
    awaitingApprovalItems.length;
  const awaitingApprovalRunIds = useMemo(
    () =>
      awaitingApprovalItems
        .map((item) => item.runId.trim())
        .filter((runId) => runId.length > 0),
    [awaitingApprovalItems],
  );
  const summaryByPartition = new Map(attentionSummaries.map((summary) => [summary.partition, summary]));
  const attentionCountsByKind = Object.fromEntries(
    OPERATOR_ATTENTION_KIND_IDS.map((kind) => [kind, summaryByPartition.get(kind)?.totalCount ?? 0]),
  ) as Partial<Record<(typeof OPERATOR_ATTENTION_KIND_IDS)[number], number>>;
  const promotedAttentionKind = resolveHighestNonZeroAttentionKind(
    attentionCountsByKind,
    OPERATOR_ATTENTION_KIND_IDS,
  );

  useEffect(() => {
    const syncDashboardStateFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);

      if (homeGovernanceWarningsQueryEnabled(params)) {
        if (!governanceWarningsOnlyRef.current) {
          governanceWarningsOnlyRef.current = true;
          setGovernanceWarningsOnly(true);
        }

        if (tabRef.current !== "all") {
          tabRef.current = "all";
          setTab("all");
        }
      }

      const nextTab = parseRunsDashboardTabFromSearch(params.get("tab"));

      if (tabRef.current !== nextTab) {
        tabRef.current = nextTab;
        setTab(nextTab);
      }

      const nextShowArchived = parseRunsDashboardShowArchivedFromSearch(params.get("archived"));

      if (showArchivedRef.current !== nextShowArchived) {
        showArchivedRef.current = nextShowArchived;
        setShowArchived(nextShowArchived);
      }
    };

    syncDashboardStateFromUrl();
    window.addEventListener("popstate", syncDashboardStateFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDashboardStateFromUrl);
    };
  }, []);

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

  const archivedFilterDisabled = !archivedFieldSupported;

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

  const awaitingApprovalTabItems = useMemo(
    () => resolveAwaitingApprovalTabItems(filteredItems, awaitingApprovalItems, projectId),
    [awaitingApprovalItems, filteredItems, projectId],
  );

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

  const statusTabCounts = useMemo(() => {
    if (!hideHeading) {
      return deriveRunsDashboardTabCounts(filteredItems, awaitingApprovalTabItems.length);
    }

    const excludeShowcaseRunId =
      buyerPolishedShell &&
      showcaseDemoRun !== undefined &&
      (phase === "ready" || phase === "error")
        ? showcaseDemoRun.runId
        : undefined;

    return deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: filterTenantOverviewRuns(homeAttentionPreviewItems),
      runsDashboardTotalCount: loadedTotalCount,
      excludeShowcaseRunId,
      awaitingApprovalCount,
      awaitingApprovalRunIds,
    }).previewTabCounts;
  }, [
    awaitingApprovalCount,
    awaitingApprovalRunIds,
    awaitingApprovalTabItems.length,
    buyerPolishedShell,
    displayItems,
    filteredItems,
    hideHeading,
    homeAttentionPreviewItems,
    loadedTotalCount,
    phase,
    showcaseDemoRun,
  ]);

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
    const tenantSnapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: loadedTotalCount,
      awaitingApprovalCount,
      awaitingApprovalRunIds,
    });
    const awaitingApprovalInMetricsStrip =
      hideHeading &&
      awaitingApprovalCount > 0 &&
      tenantSnapshot.metrics.reviewPackagesCommitted > 0;

    const previewCounts = hideHeading ? (statusTabCounts as HomePreviewTabCounts) : undefined;
    const visibleCount = previewCounts?.recentVisibleCount;

    return formatOperatorHomeRecentReviewsOutcome(tenantSnapshot.metrics, {
      exampleReviewOnly,
      visibleCount,
      recentTotalCount: previewCounts?.recentTotalCount,
      awaitingApprovalCount,
      suppressAwaitingApprovalCount:
        promotedAttentionKind === "awaiting-approval" || awaitingApprovalInMetricsStrip,
    });
  }, [
    awaitingApprovalCount,
    awaitingApprovalRunIds,
    displayItems,
    hideHeading,
    loadedTotalCount,
    phase,
    promotedAttentionKind,
    sampleReviewsVisible,
    statusTabCounts,
  ]);

  const recentReviewsOutcomeMetrics = useMemo(() => {
    if (phase !== "ready" && phase !== "error") {
      return null;
    }

    return deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: loadedTotalCount,
      awaitingApprovalCount,
      awaitingApprovalRunIds,
    }).metrics;
  }, [awaitingApprovalCount, awaitingApprovalRunIds, displayItems, loadedTotalCount, phase]);

  const recentReviewsOutcomeOptions = useMemo(() => {
    if (phase !== "ready" && phase !== "error") {
      return null;
    }

    const exampleReviewOnly = hideHeading && !sampleReviewsVisible
      ? false
      : isExampleOnlyOverviewRunList(displayItems);
    const previewCounts = hideHeading ? (statusTabCounts as HomePreviewTabCounts) : undefined;
    const tenantSnapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: loadedTotalCount,
      awaitingApprovalCount,
      awaitingApprovalRunIds,
    });
    const awaitingApprovalInMetricsStrip =
      hideHeading &&
      awaitingApprovalCount > 0 &&
      tenantSnapshot.metrics.reviewPackagesCommitted > 0;

    return {
      exampleReviewOnly,
      visibleCount: previewCounts?.recentVisibleCount,
      recentTotalCount: previewCounts?.recentTotalCount,
      awaitingApprovalCount,
      suppressAwaitingApprovalCount:
        promotedAttentionKind === "awaiting-approval" || awaitingApprovalInMetricsStrip,
    };
  }, [
    awaitingApprovalCount,
    awaitingApprovalRunIds,
    displayItems,
    hideHeading,
    loadedTotalCount,
    phase,
    promotedAttentionKind,
    sampleReviewsVisible,
    statusTabCounts,
  ]);

  const selectDashboardTab = useCallback((
    next: RunsDashboardTabId,
    options?: { readonly preserveShowArchived?: boolean },
  ) => {
    const nextShowArchived = options?.preserveShowArchived ? showArchivedRef.current : false;

    if (tabRef.current === next && showArchivedRef.current === nextShowArchived) {
      return;
    }

    tabRef.current = next;
    setTab(next);

    if (!options?.preserveShowArchived) {
      showArchivedRef.current = false;
      setShowArchived(false);
    }

    commitHrefIfChanged(
      runsDashboardHomeHrefFromSearch(readWindowLocationSearch(), {
        tab: next,
        ...(options?.preserveShowArchived ? {} : { showArchived: false }),
      }),
      { notify: false },
    );
  }, []);

  const setShowArchivedWithUrl = useCallback(
    (value: boolean) => {
      if (showArchivedRef.current === value) {
        return;
      }

      showArchivedRef.current = value;
      setShowArchived(value);
      commitHrefIfChanged(
        runsDashboardHomeHrefFromSearch(readWindowLocationSearch(), { showArchived: value }),
        { notify: false },
      );
    },
    [],
  );

  const setGovernanceWarningsOnlyWithUrl = useCallback(
    (value: boolean) => {
      if (governanceWarningsOnlyRef.current === value) {
        return;
      }

      governanceWarningsOnlyRef.current = value;
      setGovernanceWarningsOnly(value);

      const nextHref = value
        ? homeGovernanceWarningsHrefFromSearch(readWindowLocationSearch())
        : homeGovernanceWarningsClearHrefFromSearch(readWindowLocationSearch());

      commitHrefIfChanged(nextHref, { notify: false });
    },
    [],
  );

  const clearGovernanceWarningsFilter = useCallback(() => {
    setGovernanceWarningsOnlyWithUrl(false);
  }, [setGovernanceWarningsOnlyWithUrl]);

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
    setGovernanceWarningsOnly: setGovernanceWarningsOnlyWithUrl,
    showArchived,
    setShowArchived: setShowArchivedWithUrl,
    displayItems,
    filteredItems,
    approvedTabItems,
    awaitingApprovalTabItems,
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
    recentReviewsOutcomeMetrics,
    recentReviewsOutcomeOptions,
    archivedCount,
    archivedFilterDisabled,
    selectDashboardTab,
    restoreArchivedRequest: handleRestoreArchivedRequest,
    clearGovernanceWarningsFilter,
  };
}
