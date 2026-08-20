"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_DEFAULT_TAB,
  REVIEW_DETAIL_TAB_LABELS,
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";
import {
  isReviewDetailTabAdvanced,
  resolveReviewDetailTabForVisit,
  resolveReviewDetailVisibleTabs,
  type ResolveReviewDetailVisibleTabsInput,
} from "@/lib/resolve-review-detail-visible-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import { cn } from "@/lib/utils";
import { REVIEW_WORKSPACE_TAB_STRIP_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";

export type ReviewDetailTabCounts = {
  readonly findings?: number | null;
  readonly evidence?: number | null;
  readonly decisionsRemediation?: number | null;
};

export type ReviewDetailWorkspacePanels = {
  readonly overview: ReactNode;
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly policies: ReactNode;
  readonly decisionsRemediation: ReactNode;
  readonly reviewPackage: ReactNode;
  readonly architecture: ReactNode;
  readonly activity: ReactNode;
};

export type ReviewDetailWorkspaceProps = {
  readonly runId: string;
  readonly tabActivityAt?: ReviewDetailTabActivityAt;
  readonly tabCounts?: ReviewDetailTabCounts;
  readonly panels: ReviewDetailWorkspacePanels;
  /** TB-2385: shown above non-activity tab panels while pipeline work remains. */
  readonly inPipelineBanner?: ReactNode | null;
  /** When omitted, all tabs stay primary (legacy / tests). */
  readonly tabLifecycle?: ResolveReviewDetailVisibleTabsInput;
};

type ReviewDetailWorkspaceTabContextValue = {
  readonly navigateTab: (tab: ReviewDetailTabId) => void;
};

const ReviewDetailWorkspaceTabContext = createContext<ReviewDetailWorkspaceTabContextValue | null>(null);

function tabCountBadge(count: number | null | undefined, tabId: ReviewDetailTabId): number | null {
  if (count === null || count === undefined || count <= 0) {
    return null;
  }

  if (tabId === "findings" || tabId === "evidence" || tabId === "decisions-remediation") {
    return count;
  }

  return null;
}

function panelWithInPipelineBanner(
  tabId: ReviewDetailTabId,
  panel: ReactNode,
  inPipelineBanner: ReactNode | null | undefined,
): ReactNode {
  if (inPipelineBanner === null || inPipelineBanner === undefined || tabId === "activity") {
    return panel;
  }

  return (
    <div className="space-y-4">
      {inPipelineBanner}
      {panel}
    </div>
  );
}

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);
  const resolved = useMemo(() => {
    if (props.tabLifecycle !== undefined) {
      return resolveReviewDetailVisibleTabs(props.tabLifecycle);
    }

    return {
      stage: "committed" as const,
      visibleTabIds: Object.keys(REVIEW_DETAIL_TAB_LABELS) as ReviewDetailTabId[],
      advancedCollapsedTabIds: [] as ReviewDetailTabId[],
      defaultTabId: REVIEW_DETAIL_DEFAULT_TAB,
    };
  }, [props.tabLifecycle]);
  const rawTabParam = searchParams.get(REVIEW_DETAIL_TAB_PARAM);
  const searchParamTab =
    props.tabLifecycle !== undefined
      ? resolveReviewDetailTabForVisit(rawTabParam, resolved)
      : resolveReviewDetailTab(rawTabParam);
  const [activeTab, setActiveTab] = useState<ReviewDetailTabId>(searchParamTab);
  const tabActivityAt = props.tabActivityAt ?? {};
  const {
    isTabNewSinceLastVisit,
    hasAnyNewSinceLastVisit,
    markTabSeen,
    markAllTabsSeen,
  } = useReviewDetailLastVisited(props.runId, tabActivityAt);

  useEffect(() => {
    setActiveTab(searchParamTab);
  }, [searchParamTab]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(readReviewDetailTabFromWindowLocation());
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTab = useCallback(
    (tab: ReviewDetailTabId) => {
      setActiveTab(tab);
      writeReviewDetailTabToUrl(tab, { hash: null });
      markTabSeen(tab);
    },
    [markTabSeen],
  );

  useEffect(() => {
    if (hashResolved) {
      return;
    }

    const hash = window.location.hash.slice(1);
    const tabFromHash = resolveReviewDetailTabFromHash(hash);

    if (tabFromHash === null) {
      setHashResolved(true);

      return;
    }

    setActiveTab(tabFromHash);
    writeReviewDetailTabToUrl(tabFromHash, { hash });
    setHashResolved(true);

    if (hash.length > 0) {
      scheduleScrollToReviewDetailSection(hash);
    }
  }, [hashResolved]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    if (hash.length === 0) {
      return;
    }

    const tabFromHash = resolveReviewDetailTabFromHash(hash);

    if (tabFromHash !== null && tabFromHash !== activeTab) {
      return;
    }

    scheduleScrollToReviewDetailSection(hash);
  }, [activeTab, searchParams]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (hash.length === 0) {
        return;
      }

      scheduleScrollToReviewDetailSection(hash);
    };

    window.addEventListener("hashchange", onHashChange);

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const counts = props.tabCounts ?? {};
  const inPipelineBanner = props.inPipelineBanner ?? null;

  return (
    <ReviewDetailWorkspaceTabContext.Provider value={{ navigateTab }}>
      <div className="min-w-0 space-y-4" data-testid="review-detail-workspace">
        {hasAnyNewSinceLastVisit ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="review-detail-mark-all-seen"
              onClick={markAllTabsSeen}
            >
              Mark all as seen
            </Button>
          </div>
        ) : null}
        <Tabs
          className="min-w-0"
          variant="line"
          value={activeTab}
          onValueChange={(value) => navigateTab(resolveReviewDetailTab(value))}
        >
          <TabsList
            aria-label="Review workspace sections"
            data-testid={REVIEW_WORKSPACE_TAB_STRIP_TEST_ID}
            className="-mx-1 overflow-x-auto overflow-y-hidden px-1"
          >
            {resolved.visibleTabIds.map((tabId) => {
              const count =
                tabId === "findings"
                  ? tabCountBadge(counts.findings, tabId)
                  : tabId === "evidence"
                    ? tabCountBadge(counts.evidence, tabId)
                    : tabId === "decisions-remediation"
                      ? tabCountBadge(counts.decisionsRemediation, tabId)
                      : null;

              return (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  data-testid={`review-detail-workspace-tab-${tabId}`}
                  className="whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-2">
                    {REVIEW_DETAIL_TAB_LABELS[tabId]}
                    {isTabNewSinceLastVisit(tabId) ? (
                      <NewSinceLastVisitMarker testId={`review-detail-tab-new-${tabId}`} />
                    ) : null}
                  </span>
                  {count !== null ? (
                    <span
                      className={cn(
                        "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {resolved.advancedCollapsedTabIds.length > 0 ? (
            <details
              className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
              open={isReviewDetailTabAdvanced(activeTab, resolved) ? true : undefined}
              data-testid="review-detail-workspace-more-tabs"
            >
              <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                More sections
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {resolved.advancedCollapsedTabIds.map((tabId) => {
                  const count =
                    tabId === "findings"
                      ? tabCountBadge(counts.findings, tabId)
                      : tabId === "evidence"
                        ? tabCountBadge(counts.evidence, tabId)
                        : tabId === "decisions-remediation"
                          ? tabCountBadge(counts.decisionsRemediation, tabId)
                          : null;

                  return (
                    <Button
                      key={tabId}
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid={`review-detail-workspace-tab-${tabId}`}
                      aria-current={activeTab === tabId ? "page" : undefined}
                      onClick={() => navigateTab(tabId)}
                    >
                      <span className="inline-flex items-center gap-2">
                        {REVIEW_DETAIL_TAB_LABELS[tabId]}
                        {isTabNewSinceLastVisit(tabId) ? (
                          <NewSinceLastVisitMarker testId={`review-detail-tab-new-${tabId}`} />
                        ) : null}
                      </span>
                      {count !== null ? (
                        <span
                          className={cn(
                            "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                            OPERATOR_TYPOGRAPHY.helper,
                          )}
                        >
                          {count}
                        </span>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </details>
          ) : null}

          <TabsContent
            value="overview"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-overview"
          >
            {panelWithInPipelineBanner("overview", props.panels.overview, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="findings"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-findings"
          >
            {panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="evidence"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-evidence"
          >
            <PackageEvidenceEvidenceGraphVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-evidence"
            />
            {panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="policies"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-policies"
          >
            <PackageGovernanceApprovalQueueVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-governance"
            />
            {panelWithInPipelineBanner("policies", props.panels.policies, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="decisions-remediation"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-decisions-remediation"
          >
            {panelWithInPipelineBanner(
              "decisions-remediation",
              props.panels.decisionsRemediation,
              inPipelineBanner,
            )}
          </TabsContent>
          <TabsContent
            value="review-package"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-review-package"
          >
            {panelWithInPipelineBanner("review-package", props.panels.reviewPackage, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="architecture"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-architecture"
          >
            {panelWithInPipelineBanner("architecture", props.panels.architecture, inPipelineBanner)}
          </TabsContent>
          <TabsContent
            value="activity"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-activity"
          >
            <PackageActivityAuditTrailVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-activity"
            />
            {props.panels.activity}
          </TabsContent>
        </Tabs>
      </div>
    </ReviewDetailWorkspaceTabContext.Provider>
  );
}

export function useReviewDetailTabNavigation(): (tab: ReviewDetailTabId) => void {
  const context = useContext(ReviewDetailWorkspaceTabContext);

  return useCallback(
    (tab: ReviewDetailTabId) => {
      if (context !== null) {
        context.navigateTab(tab);

        return;
      }

      writeReviewDetailTabToUrl(tab, { hash: null });
    },
    [context],
  );
}
