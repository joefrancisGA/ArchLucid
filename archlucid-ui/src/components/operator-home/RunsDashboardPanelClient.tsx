"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OperatorFirstHourJourneyStrip } from "@/components/OperatorFirstHourJourneyStrip";
import { RunsDashboardAttentionTab } from "@/components/operator-home/RunsDashboardAttentionTab";
import { RunsDashboardFilters } from "@/components/operator-home/RunsDashboardFilters";
import { RunsDashboardOutcomesTab } from "@/components/operator-home/RunsDashboardOutcomesTab";
import { RunsDashboardRecentTab } from "@/components/operator-home/RunsDashboardRecentTab";
import {
  runIsShowcaseHomeExampleStory,
  runSummaryHasArchivedField,
  runsDashboardTabLabel,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase, RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRunsByProjectPaged, restoreArchitectureRequest } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import {
  getBuyerSafeReviewsTableLink,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer-safe-review-navigation";
import {
  BUYER_RUNS_DASHBOARD_RECENT_LABEL,
  BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY,
  BUYER_RUNS_DASHBOARD_RECENT_SUMMARY,
  BUYER_RUNS_DASHBOARD_SECTION_HEADING,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled, tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

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
  const [tab, setTab] = useState<RunsDashboardTabId>("recent");
  const [governanceWarningsOnly, setGovernanceWarningsOnly] = useState(false);
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

  const load = useCallback(async () => {
    setPhase("loading");
    setFailure(null);

    let nextItems: RunSummary[] = [];
    let nextFailure: ApiLoadFailureState | null = null;
    let authorityUnusable = false;
    let malformedMessage: string | null = null;

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, pageSize, { includeArchived: showArchived });
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

  useEffect(() => {
    if (matchesInitialSnapshot && initialModel !== null) {
      return;
    }

    void load();
  }, [initialModel, load, matchesInitialSnapshot]);

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

  const onlyShowcaseRunInBuyerPolishedWorkspace =
    buyerPolishedShell &&
    filteredItems.length === 1 &&
    filteredItems[0] !== undefined &&
    runIsShowcaseHomeExampleStory(filteredItems[0]);

  const runListError = phase === "error" && failure !== null && effectiveItems.length === 0;

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

  return (
    <section aria-labelledby="runs-dashboard-heading" data-onboarding="tour-runs-dashboard">
      {!hideHeading ? (
        <h3 id="runs-dashboard-heading" className={cn(OPERATOR_LAYOUT.sectionHeadingMargin, OPERATOR_HOME_SECTION_HEADING)}>
          {buyerPolishedShell ? BUYER_RUNS_DASHBOARD_SECTION_HEADING : RUNS_DASHBOARD_LABELS.sectionHeading}
        </h3>
      ) : null}
      {!buyerPolishedShell ? (
        <div className={OPERATOR_LAYOUT.sectionStack}>
          <OperatorFirstHourJourneyStrip />
        </div>
      ) : null}
      <Card
        className="border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        data-testid="runs-dashboard-panel"
      >
        <CardHeader className={OPERATOR_CARD.header}>
          <div className={cn("flex flex-wrap", OPERATOR_LAYOUT.inlineGap)} role="tablist" aria-label="Review views">
            {(["recent", "attention", "outcomes"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                data-testid={`runs-dashboard-tab-${id}`}
                className={cn(
                  "border-b-2 border-transparent bg-transparent px-0 py-0.5",
                  OPERATOR_TYPE_SCALE.tab,
                  tab === id
                    ? "border-teal-700 text-teal-900 dark:border-teal-300 dark:text-teal-200"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100",
                )}
                onClick={() => {
                  setTab(id);
                }}
              >
                {runsDashboardTabLabel(id, buyerPolishedShell)}
              </button>
            ))}
          </div>
          <CardTitle className={cn(OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
            {tab === "recent" && buyerPolishedShell
              ? showcaseDemoRun !== undefined
                ? BUYER_RUNS_DASHBOARD_RECENT_LABEL
                : BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY
              : tab === "recent"
                ? RUNS_DASHBOARD_LABELS.latestInWorkspace
                : null}
            {tab === "attention"
              ? buyerPolishedShell
                ? RUNS_DASHBOARD_LABELS.packagingPreFinalPosture
                : RUNS_DASHBOARD_LABELS.reviewsNeedingAttention
              : null}
            {tab === "outcomes" ? RUNS_DASHBOARD_LABELS.reviewOutcomes : null}
          </CardTitle>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
            {tab === "recent"
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
                : "Review packages finalized, findings surfaced, and average time to finalization."
              : null}
          </p>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, OPERATOR_LAYOUT.sectionStack, OPERATOR_TYPE_SCALE.body)}>
          <RunsDashboardFilters
            buyerPolishedShell={buyerPolishedShell}
            governanceWarningsOnly={governanceWarningsOnly}
            showArchived={showArchived}
            onGovernanceWarningsOnlyChange={setGovernanceWarningsOnly}
            onShowArchivedChange={setShowArchived}
          />

          {tab === "recent" ? (
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
              onRestoreArchivedRequest={(requestId) => {
                void restoreArchivedRequest(requestId);
              }}
            />
          ) : null}

          {tab === "attention" ? (
            <RunsDashboardAttentionTab
              phase={phase}
              failure={failure}
              runListError={runListError}
              filteredItems={filteredItems}
            />
          ) : null}

          {tab === "outcomes" ? (
            <RunsDashboardOutcomesTab buyerPolishedShell={buyerPolishedShell} showcaseDemoRun={showcaseDemoRun} />
          ) : null}

          {!onlyShowcaseRunInBuyerPolishedWorkspace ? (
            <Link
              href={`/reviews?projectId=${encodeURIComponent(projectId)}`}
              className={cn("inline-block font-semibold", OPERATOR_LINK.nav)}
            >
              {RUNS_DASHBOARD_LABELS.openFullReviewsList}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
