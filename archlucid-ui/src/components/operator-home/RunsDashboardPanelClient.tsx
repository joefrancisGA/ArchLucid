"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { RunsDashboardAttentionTab } from "@/components/operator-home/RunsDashboardAttentionTab";
import { RunsDashboardFilters } from "@/components/operator-home/RunsDashboardFilters";
import { RunsDashboardOutcomesTab } from "@/components/operator-home/RunsDashboardOutcomesTab";
import { RunsDashboardRecentTab } from "@/components/operator-home/RunsDashboardRecentTab";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import {
  deriveRunsDashboardTabCounts,
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  isRunNeedingAttention,
  resolveShowcaseDemoRunForItems,
  runIsShowcaseHomeExampleStory,
  runSummaryHasArchivedField,
  runsDashboardTabLabel,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase, RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { useOptionalOperatorHomeRefresh } from "@/lib/operator-home-refresh-context";
import {
  resolveRunsDashboardClientLoadMode,
  shouldShowRunsDashboardInitialSkeleton,
  shouldSkipRunsDashboardClientFetchOnMount,
  type RunsDashboardClientLoadMode,
} from "@/lib/operator-home-runs-dashboard-client-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listRunsByProjectPaged, restoreArchitectureRequest } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import {
  getBuyerSafeReviewsTableLink,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer-safe-review-navigation";
import {
  BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES,
  BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY,
  BUYER_RUNS_DASHBOARD_RECENT_SUMMARY,
  BUYER_RUNS_DASHBOARD_SECTION_HEADING,
} from "@/lib/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer-shell-home-present";
import {
  OPERATOR_CARD,
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM } from "@/lib/operator-home-metric-hrefs";
import {
  filterTenantOverviewRuns,
  formatOperatorHomeRecentReviewsOutcome,
  isExampleOnlyOverviewRunList,
} from "@/lib/operator-home-recent-reviews-outcome";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import {
  buildDemoSeededOverviewRunSummary,
  resolveOverviewListProjectId,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator-scope-storage";
import { isStaticDemoPayloadFallbackEnabled, tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

function homeGovernanceWarningsQueryEnabled(searchParams: URLSearchParams | null): boolean {
  if (searchParams === null) {
    return false;
  }

  const raw = searchParams.get(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM);

  return raw === "1" || raw === "true";
}

export type RunsDashboardPanelClientProps = {
  /** Suppress the built-in section heading when a parent zone heading already labels this panel. */
  readonly hideHeading?: boolean;
  /** Server-loaded runs snapshot for first paint (TB-564). */
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function RunsDashboardPanelClient({
  hideHeading = false,
  initialModel = null,
}: RunsDashboardPanelClientProps = {}) {
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
      DEFAULT_PROJECT_ID,
    );
  const pageSize = initialModel?.pageSize ?? OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE;
  const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();
  const homeRefresh = useOptionalOperatorHomeRefresh();

  useEffect(() => {
    // Deep-link from Workspace metrics "Governance warnings" (`/?warnings=1`).
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
      // showArchived is client-side filter only until runs list declares includeArchived (avoids 400).
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, pageSize, {
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
    if (skipClientFetchOnMount) {
      return;
    }

    const mode = resolveRunsDashboardClientLoadMode(initialModel?.items.length ?? 0);

    void load({ mode });
  }, [initialModel, load, skipClientFetchOnMount]);

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

      // Browser-only — SSR must not use getEffectiveBrowserProxyScopeHeaders() (dev defaults).
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

  const archivedFieldSupported = useMemo(
    () => effectiveItems.some(runSummaryHasArchivedField),
    [effectiveItems],
  );

  const archivedCount = useMemo(() => {
    if (!archivedFieldSupported) {
      return 0;
    }

    return effectiveItems.filter((run) => run.isArchived === true).length;
  }, [archivedFieldSupported, effectiveItems]);

  const archivedFilterDisabled = !archivedFieldSupported || archivedCount === 0;

  useEffect(() => {
    if (archivedFilterDisabled && showArchived) {
      setShowArchived(false);
    }
  }, [archivedFilterDisabled, showArchived]);

  const filteredItems = useMemo(() => {
    let rows = effectiveItems;

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
  }, [archivedFieldSupported, effectiveItems, governanceWarningsOnly, showArchived]);

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

  const statusTabCounts = useMemo(() => deriveRunsDashboardTabCounts(filteredItems), [filteredItems]);

  const allTabShowcase = resolveShowcaseDemoRunForItems(filteredItems, showcaseDemoRun);
  const approvedTabShowcase = resolveShowcaseDemoRunForItems(approvedTabItems, showcaseDemoRun);
  const attentionTabShowcase = resolveShowcaseDemoRunForItems(attentionTabItems, showcaseDemoRun);
  const monitoringTabShowcase = resolveShowcaseDemoRunForItems(monitoringTabItems, showcaseDemoRun);

  const runListError = phase === "error" && failure !== null && effectiveItems.length === 0;
  const showInitialLoadingSkeleton = shouldShowRunsDashboardInitialSkeleton(phase, effectiveItems.length);
  const showReviewFilters =
    effectiveItems.length > 0 && (phase === "ready" || phase === "error");
  // Prefer the same strip gate as before; zero-count facets are filtered from statusTabIds below.

  useEffect(() => {
    if (phase === "ready" || phase === "error") {
      // effectiveItems can carry client-only fallback rows the server total never counted, and a
      // keyset total is only a lower bound — publish whichever count is larger.
      reportWorkspaceReviews(effectiveItems, Math.max(loadedTotalCount, effectiveItems.length));
    }
  }, [effectiveItems, loadedTotalCount, phase, reportWorkspaceReviews]);

  async function restoreArchivedRequest(requestId: string): Promise<void> {
    setRestoreBusyRequestId(requestId);

    try {
      await restoreArchitectureRequest(requestId);
      await load({ mode: "background" });
      setShowArchived(false);
    } finally {
      setRestoreBusyRequestId(null);
    }
  }

  const openAllReviewsHref = `/architecture/reviews?projectId=${encodeURIComponent(projectId)}`;

  const buyerStatusTabIds: readonly RunsDashboardTabId[] = ["all", "approved", "attention", "outcomes"];
  const operatorStatusTabIds: readonly RunsDashboardTabId[] = ["all", "attention", "outcomes"];
  const rawStatusTabIds = buyerPolishedShell ? buyerStatusTabIds : operatorStatusTabIds;
  // Buyer Overview: omit zero-count facets (Approved (0) theater). Operator keeps full tab strip.
  const statusTabIds = buyerPolishedShell
    ? rawStatusTabIds.filter((id) => id === "all" || statusTabCounts[id] > 0)
    : rawStatusTabIds;

  // Buyer status pills are all filtered review lists; operator keeps Outcomes as metrics.
  const isRecentListTab =
    tab === "all" ||
    tab === "approved" ||
    (buyerPolishedShell && (tab === "attention" || tab === "outcomes"));

  const recentReviewsOutcomeLine = useMemo(() => {
    if (phase !== "ready" && phase !== "error") {
      return null;
    }

    const exampleReviewOnly = isExampleOnlyOverviewRunList(effectiveItems);
    const tenantItems = filterTenantOverviewRuns(effectiveItems);
    const metrics = deriveOperatorHomeWorkspaceMetrics(tenantItems, tenantItems.length);

    return formatOperatorHomeRecentReviewsOutcome(metrics, { exampleReviewOnly });
  }, [effectiveItems, phase]);

  const selectDashboardTab = (next: RunsDashboardTabId) => {
    setTab(next);
    setShowArchived(false);
  };

  return (
    <section aria-labelledby="runs-dashboard-heading" data-onboarding="tour-runs-dashboard">
      {!hideHeading ? (
        <h3 id="runs-dashboard-heading" className={cn(OPERATOR_LAYOUT.sectionHeadingMargin, OPERATOR_HOME_SECTION_HEADING)}>
          {buyerPolishedShell ? BUYER_RUNS_DASHBOARD_SECTION_HEADING : RUNS_DASHBOARD_LABELS.sectionHeading}
        </h3>
      ) : null}
      {hideHeading && recentReviewsOutcomeLine !== null ? (
        <p
          className={cn("m-0 mb-3", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
          data-testid="operator-home-recent-reviews-outcome"
        >
          {recentReviewsOutcomeLine}
        </p>
      ) : null}
      <Tabs
        value={tab}
        onValueChange={(next) => {
          selectDashboardTab(next as RunsDashboardTabId);
        }}
      >
        <Card
          className={cn(
            showReviewFilters
              ? "border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              : "border-0 bg-transparent shadow-none",
          )}
          data-testid="runs-dashboard-panel"
        >
          {showReviewFilters ? (
            <CardHeader className={OPERATOR_CARD.header}>
              {buyerPolishedShell && hideHeading ? null : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className={cn(OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
                  {buyerPolishedShell
                    ? BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY
                    : isRecentListTab
                      ? RUNS_DASHBOARD_LABELS.latestInWorkspace
                      : null}
                  {!buyerPolishedShell && tab === "attention" ? RUNS_DASHBOARD_LABELS.reviewsNeedingAttention : null}
                  {!buyerPolishedShell && tab === "outcomes" ? RUNS_DASHBOARD_LABELS.reviewOutcomes : null}
                </CardTitle>
                {!buyerPolishedShell ? (
                  <Link
                    href={openAllReviewsHref}
                    className={cn("inline-block shrink-0 font-semibold sm:ml-auto", OPERATOR_LINK.nav)}
                    data-testid="runs-dashboard-open-all-reviews"
                  >
                    {RUNS_DASHBOARD_LABELS.openFullReviewsList}
                  </Link>
                ) : null}
              </div>
              )}
              <div className={cn("flex flex-wrap items-center gap-2", buyerPolishedShell ? "" : OPERATOR_LAYOUT.inlineGap)}>
                {buyerPolishedShell ? (
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Filter reviews"
                    data-testid="runs-dashboard-status-filters"
                  >
                    {statusTabIds.map((id) => {
                      const label = runsDashboardTabLabel(id, buyerPolishedShell, statusTabCounts[id]);
                      const selected = tab === id && !showArchived;

                      return (
                        <FilterChip
                          key={id}
                          data-testid={`runs-dashboard-filter-${id}`}
                          className={buyerFilterChipClass(selected, false, statusTabCounts[id] === 0)}
                          aria-pressed={selected}
                          aria-label={`Filter reviews: ${label}`}
                          onClick={() => {
                            selectDashboardTab(id);
                          }}
                        >
                          {label}
                        </FilterChip>
                      );
                    })}
                    {archivedFieldSupported ? (
                      <FilterChip
                        data-testid="runs-dashboard-show-archived"
                        className={buyerFilterChipClass(showArchived, archivedFilterDisabled)}
                        aria-pressed={showArchived}
                        aria-label={`Filter reviews: Archived ${archivedCount}`}
                        disabled={archivedFilterDisabled}
                        onClick={() => {
                          if (archivedFilterDisabled) {
                            return;
                          }

                          setTab("all");
                          setShowArchived(!showArchived);
                        }}
                      >
                        Archived {archivedCount}
                      </FilterChip>
                    ) : null}
                  </div>
                ) : (
                  <TabsList
                    aria-label="Review views"
                    data-testid="runs-dashboard-status-filters"
                    className="-mb-px overflow-x-auto"
                  >
                    {statusTabIds.map((id) => (
                      <TabsTrigger
                        key={id}
                        value={id}
                        data-testid={`runs-dashboard-tab-${id}`}
                        className="shrink-0"
                      >
                        {runsDashboardTabLabel(id, buyerPolishedShell, statusTabCounts[id])}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}
              </div>
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
                {isRecentListTab
                  ? buyerPolishedShell
                    ? BUYER_RUNS_DASHBOARD_RECENT_SUMMARY
                    : RUNS_DASHBOARD_LABELS.recentSummary
                  : null}
                {!isRecentListTab && tab === "attention"
                  ? buyerPolishedShell
                    ? RUNS_DASHBOARD_LABELS.attentionSummaryBuyer
                    : RUNS_DASHBOARD_LABELS.attentionSummary
                  : null}
                {!isRecentListTab && tab === "outcomes"
                  ? "Reviews finalized, findings surfaced, and average time to finalization."
                  : null}
              </p>
            </CardHeader>
          ) : null}
          <CardContent
            className={cn(
              showReviewFilters ? OPERATOR_CARD.content : "p-0",
              OPERATOR_LAYOUT.sectionStack,
              OPERATOR_TYPE_SCALE.body,
            )}
          >
            <RunsDashboardFilters
              buyerPolishedShell={buyerPolishedShell}
              governanceWarningsOnly={governanceWarningsOnly}
              showArchived={showArchived}
              onGovernanceWarningsOnlyChange={setGovernanceWarningsOnly}
              onShowArchivedChange={setShowArchived}
            />

            <TabsContent value="all" className="pt-0" data-testid="runs-dashboard-panel-all">
              <RunsDashboardRecentTab
                phase={phase}
                showInitialLoadingSkeleton={showInitialLoadingSkeleton}
                failure={failure}
                runListError={runListError}
                filteredItems={filteredItems}
                effectiveItems={effectiveItems}
                buyerPolishedShell={buyerPolishedShell}
                showcaseDemoRun={allTabShowcase}
                showcasePrimaryCta={allTabShowcase !== undefined ? showcasePrimaryCta : null}
                buyerSafeHighlight={allTabShowcase !== undefined && buyerSafeHighlight}
                showArchived={showArchived}
                archivedFieldSupported={archivedFieldSupported}
                restoreBusyRequestId={restoreBusyRequestId}
                contentTestId="runs-dashboard-tab-all"
                onRestoreArchivedRequest={(requestId) => {
                  void restoreArchivedRequest(requestId);
                }}
              />
            </TabsContent>

            <TabsContent value="approved" className="pt-0" data-testid="runs-dashboard-panel-approved">
              <RunsDashboardRecentTab
                phase={phase}
                showInitialLoadingSkeleton={showInitialLoadingSkeleton}
                failure={failure}
                runListError={runListError}
                filteredItems={approvedTabItems}
                effectiveItems={effectiveItems}
                buyerPolishedShell={buyerPolishedShell}
                showcaseDemoRun={approvedTabShowcase}
                showcasePrimaryCta={approvedTabShowcase !== undefined ? showcasePrimaryCta : null}
                buyerSafeHighlight={approvedTabShowcase !== undefined && buyerSafeHighlight}
                showArchived={showArchived}
                archivedFieldSupported={archivedFieldSupported}
                restoreBusyRequestId={restoreBusyRequestId}
                contentTestId="runs-dashboard-tab-approved"
                statusFilterEmptyMessage={BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES}
                onRestoreArchivedRequest={(requestId) => {
                  void restoreArchivedRequest(requestId);
                }}
              />
            </TabsContent>

            <TabsContent value="attention" className="pt-0" data-testid="runs-dashboard-panel-attention">
              {buyerPolishedShell ? (
                <RunsDashboardRecentTab
                  phase={phase}
                  showInitialLoadingSkeleton={showInitialLoadingSkeleton}
                  failure={failure}
                  runListError={runListError}
                  filteredItems={attentionTabItems}
                  effectiveItems={effectiveItems}
                  buyerPolishedShell={buyerPolishedShell}
                  showcaseDemoRun={attentionTabShowcase}
                  showcasePrimaryCta={attentionTabShowcase !== undefined ? showcasePrimaryCta : null}
                  buyerSafeHighlight={attentionTabShowcase !== undefined && buyerSafeHighlight}
                  showArchived={showArchived}
                  archivedFieldSupported={archivedFieldSupported}
                  restoreBusyRequestId={restoreBusyRequestId}
                  contentTestId="runs-dashboard-tab-attention"
                  statusFilterEmptyMessage={RUNS_DASHBOARD_LABELS.noReviewsNeedAttention}
                  onRestoreArchivedRequest={(requestId) => {
                    void restoreArchivedRequest(requestId);
                  }}
                />
              ) : (
                <RunsDashboardAttentionTab
                  phase={phase}
                  failure={failure}
                  runListError={runListError}
                  filteredItems={filteredItems}
                />
              )}
            </TabsContent>

            <TabsContent value="outcomes" className="pt-0" data-testid="runs-dashboard-panel-outcomes">
              {buyerPolishedShell ? (
                <RunsDashboardRecentTab
                  phase={phase}
                  showInitialLoadingSkeleton={showInitialLoadingSkeleton}
                  failure={failure}
                  runListError={runListError}
                  filteredItems={monitoringTabItems}
                  effectiveItems={effectiveItems}
                  buyerPolishedShell={buyerPolishedShell}
                  showcaseDemoRun={monitoringTabShowcase}
                  showcasePrimaryCta={monitoringTabShowcase !== undefined ? showcasePrimaryCta : null}
                  buyerSafeHighlight={monitoringTabShowcase !== undefined && buyerSafeHighlight}
                  showArchived={showArchived}
                  archivedFieldSupported={archivedFieldSupported}
                  restoreBusyRequestId={restoreBusyRequestId}
                  contentTestId="runs-dashboard-tab-outcomes"
                  statusFilterEmptyMessage={BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES}
                  onRestoreArchivedRequest={(requestId) => {
                    void restoreArchivedRequest(requestId);
                  }}
                />
              ) : (
                <RunsDashboardOutcomesTab buyerPolishedShell={buyerPolishedShell} showcaseDemoRun={showcaseDemoRun} />
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
