"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
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
import { useOptionalOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";
import {
  resolveRunsDashboardClientLoadMode,
  shouldShowRunsDashboardInitialSkeleton,
  shouldSkipRunsDashboardClientFetchOnMount,
  type RunsDashboardClientLoadMode,
} from "@/lib/operator/operator-home-runs-dashboard-client-fetch";
import {
  consumeOperatorHomeRunsSnapshotStale,
  subscribeOperatorHomeLifecycleRefresh,
} from "@/lib/operator/operator-home-lifecycle-notify";
import {
  homeGovernanceWarningsQueryEnabled,
  resolveRunsDashboardOpenAllReviewsHref,
  resolveRunsDashboardRecentListTab,
  resolveRunsDashboardStatusTabIds,
  RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { fetchPagedReviewsInventory, restoreArchitectureRequest } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
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
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import {
  buildDemoSeededOverviewRunSummary,
  resolveOverviewListProjectId,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { isStaticDemoPayloadFallbackEnabled, tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";

export type UseRunsDashboardPanelOptions = {
  readonly hideHeading?: boolean;
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function useRunsDashboardPanel({
  hideHeading = false,
  initialModel = null,
}: UseRunsDashboardPanelOptions = {}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<RunsDashboardTabId>("all");
  const [governanceWarningsOnly, setGovernanceWarningsOnly] = useState(() =>
    homeGovernanceWarningsQueryEnabled(searchParams),
  );
  const [showArchived, setShowArchived] = useState(false);
  const [restoreBusyRequestId, setRestoreBusyRequestId] = useState<string | null>(null);
  const [items, setItems] = useState<RunSummary[]>(initialModel?.items ?? []);
  const [loadedTotalCount, setLoadedTotalCount] = useState<number>(initialModel?.totalCount ?? 0);
  const [phase, setPhase] = useState<RunsDashboardLoadPhase>(
    initialModel !== null ? (initialModel.loadFailure !== null ? "error" : "ready") : "loading",
  );
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(initialModel?.loadFailure ?? null);
  const [runsListAuthorityUnusable, setRunsListAuthorityUnusable] = useState(initialModel?.loadFailure !== null);
  const itemsRef = useRef(items);

  itemsRef.current = items;

  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const projectId =
    initialModel?.projectId ??
    resolveOverviewListProjectId(
      typeof window !== "undefined" ? getEffectiveBrowserProxyScopeHeaders() : null,
      RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID,
    );
  const pageSize = initialModel?.pageSize ?? OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE;
  const { reportWorkspaceReviews, homeAttentionPreviewExcludedRunIds } = useOperatorHomeWorkspaceActivity();
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();
  const homeRefresh = useOptionalOperatorHomeRefresh();

  useEffect(() => {
    if (homeGovernanceWarningsQueryEnabled(searchParams)) {
      setGovernanceWarningsOnly(true);
      setTab("all");
    }
  }, [searchParams]);

  const load = useCallback(async (options?: { readonly mode?: RunsDashboardClientLoadMode }) => {
    const mode = options?.mode ?? "initial";
    const paintedItemCount = itemsRef.current.length;

    if (mode === "initial" && paintedItemCount === 0) {
      setPhase("loading");
      setFailure(null);
    }

    let nextItems: RunSummary[] = [];
    let nextTotalCount = 0;
    let nextFailure: ApiLoadFailureState | null = null;
    let authorityUnusable = false;
    let malformedMessage: string | null = null;

    try {
      const raw: unknown = await fetchPagedReviewsInventory({
        projectId,
        page: 1,
        pageSize,
        cursor: "",
        scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
      });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        malformedMessage = coerced.message;
        authorityUnusable = true;
      } else {
        nextItems = coerced.value.items;
        nextTotalCount = coerced.value.totalCount;
      }
    } catch (error: unknown) {
      nextFailure = toApiLoadFailure(error);
      authorityUnusable = true;
    }

    const demoPaged =
      nextFailure !== null || malformedMessage !== null
        ? tryStaticDemoRunSummariesPaged(projectId, { afterAuthorityListFailure: true })
        : null;

    if (demoPaged !== null) {
      nextItems = demoPaged.items;
      nextTotalCount = demoPaged.totalCount;
      nextFailure = null;
      malformedMessage = null;
      authorityUnusable = false;
    }

    if (
      nextFailure === null &&
      malformedMessage === null &&
      nextItems.length === 0 &&
      isStaticDemoPayloadFallbackEnabled()
    ) {
      const emptyWorkspaceDemo = tryStaticDemoRunSummariesPaged(projectId);

      if (emptyWorkspaceDemo !== null && emptyWorkspaceDemo.items.length > 0) {
        nextItems = emptyWorkspaceDemo.items;
        nextTotalCount = emptyWorkspaceDemo.totalCount;
      }
    }

    if (
      typeof window !== "undefined" &&
      shouldInjectDemoSeededOverviewSample({
        itemCount: nextItems.length,
        scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
        workspaceLabel: readOperatorScopeFromStorage()?.workspaceLabel ?? null,
        staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
      })
    ) {
      nextItems = [buildDemoSeededOverviewRunSummary(projectId, getEffectiveBrowserProxyScopeHeaders())];
      nextTotalCount = nextItems.length;
      nextFailure = null;
      malformedMessage = null;
      authorityUnusable = false;
    }

    nextItems = dedupeRunSummariesByRunId(nextItems.map(normalizeRunSummaryForDemoPicker));

    if (malformedMessage !== null && nextFailure === null) {
      nextFailure = uiFailureFromMessage(malformedMessage);
      authorityUnusable = true;
    }

    setItems(nextItems);
    setLoadedTotalCount(nextTotalCount);
    setFailure(nextFailure);
    setRunsListAuthorityUnusable(authorityUnusable);
    setPhase(nextFailure !== null && nextItems.length === 0 ? "error" : "ready");
  }, [pageSize, projectId]);

  const skipClientFetchOnMount = shouldSkipRunsDashboardClientFetchOnMount(initialModel, projectId);

  useEffect(() => {
    const runsSnapshotStale = consumeOperatorHomeRunsSnapshotStale();

    if (skipClientFetchOnMount && !runsSnapshotStale) {
      return;
    }

    const mode = runsSnapshotStale
      ? "background"
      : resolveRunsDashboardClientLoadMode(initialModel?.items.length ?? 0);

    void load({ mode });
  }, [initialModel, load, skipClientFetchOnMount]);

  useEffect(() => {
    return subscribeOperatorHomeLifecycleRefresh(() => {
      void load({ mode: "background" });
    });
  }, [load]);

  useEffect(() => {
    if (homeRefresh === null) {
      return;
    }

    return homeRefresh.registerRefreshLoader(async () => {
      await load({ mode: "background" });
    });
  }, [homeRefresh, load]);

  const effectiveItems = useMemo(() => {
    if (items.length > 0) {
      return items;
    }

    if (phase !== "ready" && phase !== "error") {
      return items;
    }

    const fallback = tryStaticDemoRunSummariesPaged(projectId, {
      afterAuthorityListFailure: runsListAuthorityUnusable,
    });

    if (fallback !== null && fallback.items.length > 0) {
      return fallback.items;
    }

    if (phase === "ready" && items.length === 0 && !runsListAuthorityUnusable) {
      const emptyWorkspaceFallback = tryStaticDemoRunSummariesPaged(projectId, { afterEmptyLiveList: true });

      if (emptyWorkspaceFallback !== null && emptyWorkspaceFallback.items.length > 0) {
        return emptyWorkspaceFallback.items;
      }

      if (
        typeof window !== "undefined" &&
        shouldInjectDemoSeededOverviewSample({
          itemCount: 0,
          scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
          workspaceLabel: readOperatorScopeFromStorage()?.workspaceLabel ?? null,
          staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
        })
      ) {
        return [buildDemoSeededOverviewRunSummary(projectId, getEffectiveBrowserProxyScopeHeaders())];
      }
    }

    return items;
  }, [items, phase, projectId, runsListAuthorityUnusable]);

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

  const restoreArchivedRequest = useCallback(async (requestId: string): Promise<void> => {
    setRestoreBusyRequestId(requestId);

    try {
      await restoreArchitectureRequest(requestId);
      await load({ mode: "background" });
      setShowArchived(false);
    } finally {
      setRestoreBusyRequestId(null);
    }
  }, [load]);

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

  return {
    hideHeading,
    tab,
    buyerPolishedShell,
    governanceWarningsOnly,
    setGovernanceWarningsOnly,
    showArchived,
    setShowArchived,
    restoreBusyRequestId,
    phase,
    failure,
    effectiveItems,
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
    restoreArchivedRequest,
  };
}

export type RunsDashboardPanelViewModel = ReturnType<typeof useRunsDashboardPanel>;
