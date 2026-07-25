"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { RunsDashboardAttentionTab } from "@/components/operator-home/RunsDashboardAttentionTab";
import { RunsDashboardFilters } from "@/components/operator-home/RunsDashboardFilters";
import { RunsDashboardOutcomesTab } from "@/components/operator-home/RunsDashboardOutcomesTab";
import { RunsDashboardRecentTab } from "@/components/operator-home/RunsDashboardRecentTab";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import {
  isRunApprovedPackage,
  runIsShowcaseHomeExampleStory,
  runSummaryHasArchivedField,
  runsDashboardTabLabel,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase, RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA,
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
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM } from "@/lib/operator-home-metric-hrefs";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
  const [phase, setPhase] = useState<RunsDashboardLoadPhase>(
    initialModel !== null ? (initialModel.loadFailure !== null ? "error" : "ready") : "loading",
  );
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(initialModel?.loadFailure ?? null);
  const [runsListAuthorityUnusable, setRunsListAuthorityUnusable] = useState(initialModel?.loadFailure !== null);

  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const projectId = initialModel?.projectId ?? DEFAULT_PROJECT_ID;
  const pageSize = initialModel?.pageSize ?? OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE;
  const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

  useEffect(() => {
    // Deep-link from Workspace metrics "Governance warnings" (`/?warnings=1`).
    if (homeGovernanceWarningsQueryEnabled(searchParams)) {
      setGovernanceWarningsOnly(true);
      setTab("all");
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setPhase("loading");
    setFailure(null);

    let nextItems: RunSummary[] = [];
    let nextFailure: ApiLoadFailureState | null = null;
    let authorityUnusable = false;
    let malformedMessage: string | null = null;

    try {
      // showArchived is client-side filter only until runs list declares includeArchived (avoids 400).
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, pageSize);
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        malformedMessage = coerced.message;
        authorityUnusable = true;
      } else {
        nextItems = coerced.value.items;
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
      }
    }

    nextItems = dedupeRunSummariesByRunId(nextItems.map(normalizeRunSummaryForDemoPicker));

    if (malformedMessage !== null && nextFailure === null) {
      nextFailure = uiFailureFromMessage(malformedMessage);
      authorityUnusable = true;
    }

    setItems(nextItems);
    setFailure(nextFailure);
    setRunsListAuthorityUnusable(authorityUnusable);
    setPhase(nextFailure !== null && nextItems.length === 0 ? "error" : "ready");
  }, [pageSize, projectId, showArchived]);

  const matchesInitialSnapshot =
    initialModel !== null && showArchived === false && projectId === initialModel.projectId;
  const shouldSkipInitialClientFetch =
    matchesInitialSnapshot &&
    initialModel !== null &&
    initialModel.loadFailure === null &&
    initialModel.items.length > 0;

  useEffect(() => {
    if (shouldSkipInitialClientFetch) {
      return;
    }

    void load();
  }, [initialModel, load, shouldSkipInitialClientFetch]);

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

  const runListError = phase === "error" && failure !== null && effectiveItems.length === 0;
  const showReviewFilters =
    effectiveItems.length > 0 && (phase === "ready" || phase === "error");

  useEffect(() => {
    if (phase === "ready" || phase === "error") {
      reportWorkspaceReviews(effectiveItems);
    }
  }, [effectiveItems, phase, reportWorkspaceReviews]);

  async function restoreArchivedRequest(requestId: string): Promise<void> {
    setRestoreBusyRequestId(requestId);

    try {
      await restoreArchitectureRequest(requestId);
      await load();
      setShowArchived(false);
    } finally {
      setRestoreBusyRequestId(null);
    }
  }

  const openAllReviewsHref = `/reviews?projectId=${encodeURIComponent(projectId)}`;

  const buyerStatusTabIds: readonly RunsDashboardTabId[] = ["all", "approved", "attention", "outcomes"];
  const operatorStatusTabIds: readonly RunsDashboardTabId[] = ["all", "attention", "outcomes"];
  const statusTabIds = buyerPolishedShell ? buyerStatusTabIds : operatorStatusTabIds;

  const isRecentListTab = tab === "all" || tab === "approved";

  const buyerFilterPillClass = (active: boolean, disabled: boolean = false) =>
    cn(
      "inline-flex min-h-[22px] items-center rounded-full border px-3 py-1 transition-colors",
      OPERATOR_TYPOGRAPHY.badge,
      buyerFilterChipClass(active, disabled),
    );

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
                <TabsList
                  aria-label={buyerPolishedShell ? "Review views" : "Review views"}
                  data-testid="runs-dashboard-status-filters"
                  className={cn(
                    buyerPolishedShell ? "gap-1 border-0" : "-mb-px overflow-x-auto",
                  )}
                >
                  {statusTabIds.map((id) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      data-testid={`runs-dashboard-tab-${id}`}
                      className={
                        buyerPolishedShell
                          ? cn(
                              buyerFilterPillClass(tab === id && !showArchived),
                              "!mb-0 min-h-[22px] rounded-full border px-3 py-1 !border-b-2",
                              OPERATOR_TYPOGRAPHY.badge,
                            )
                          : "shrink-0"
                      }
                    >
                      {runsDashboardTabLabel(id, buyerPolishedShell)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {buyerPolishedShell && archivedFieldSupported ? (
                  <button
                    type="button"
                    aria-pressed={showArchived}
                    disabled={archivedFilterDisabled}
                    data-testid="runs-dashboard-show-archived"
                    onClick={() => {
                      if (archivedFilterDisabled) {
                        return;
                      }

                      setTab("all");
                      setShowArchived(!showArchived);
                    }}
                    className={buyerFilterPillClass(showArchived, archivedFilterDisabled)}
                  >
                    Archived {archivedCount}
                  </button>
                ) : null}
              </div>
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
                {isRecentListTab
                  ? buyerPolishedShell
                    ? BUYER_RUNS_DASHBOARD_RECENT_SUMMARY
                    : RUNS_DASHBOARD_LABELS.recentSummary
                  : null}
                {tab === "attention"
                  ? buyerPolishedShell
                    ? RUNS_DASHBOARD_LABELS.attentionSummaryBuyer
                    : RUNS_DASHBOARD_LABELS.attentionSummary
                  : null}
                {tab === "outcomes"
                  ? buyerPolishedShell && showcaseDemoRun !== undefined
                    ? "Representative governance posture for this workspace."
                    : "Reviews finalized, findings surfaced, and average time to finalization."
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
                failure={failure}
                runListError={runListError}
                filteredItems={filteredItems}
                effectiveItems={effectiveItems}
                buyerPolishedShell={buyerPolishedShell}
                showcaseDemoRun={showcaseDemoRun}
                showcasePrimaryCta={showcasePrimaryCta}
                buyerSafeHighlight={buyerSafeHighlight}
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
                failure={failure}
                runListError={runListError}
                filteredItems={approvedTabItems}
                effectiveItems={effectiveItems}
                buyerPolishedShell={buyerPolishedShell}
                showcaseDemoRun={undefined}
                showcasePrimaryCta={null}
                buyerSafeHighlight={false}
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
              <RunsDashboardAttentionTab
                phase={phase}
                failure={failure}
                runListError={runListError}
                filteredItems={filteredItems}
              />
            </TabsContent>

            <TabsContent value="outcomes" className="pt-0" data-testid="runs-dashboard-panel-outcomes">
              <RunsDashboardOutcomesTab buyerPolishedShell={buyerPolishedShell} showcaseDemoRun={showcaseDemoRun} />
            </TabsContent>
            {buyerPolishedShell && effectiveItems.length > 0 ? (
              <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <Link
                  href={openAllReviewsHref}
                  data-testid="runs-dashboard-open-review-packages"
                  className={cn("inline-block font-semibold", OPERATOR_LINK.nav)}
                >
                  {BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA}
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
