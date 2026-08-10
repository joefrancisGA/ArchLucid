"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_TAB_LABELS,
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import { cn } from "@/lib/utils";

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

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);
  const searchParamTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));
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
            data-testid="review-detail-workspace-tabs"
            className="-mx-1 overflow-x-auto overflow-y-hidden px-1"
          >
              {(Object.keys(REVIEW_DETAIL_TAB_LABELS) as ReviewDetailTabId[]).map((tabId) => {
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

          <TabsContent
            value="overview"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-overview"
          >
            {props.panels.overview}
          </TabsContent>
          <TabsContent
            value="findings"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-findings"
          >
            {props.panels.findings}
          </TabsContent>
          <TabsContent
            value="evidence"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-evidence"
          >
            {props.panels.evidence}
          </TabsContent>
          <TabsContent
            value="policies"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-policies"
          >
            {props.panels.policies}
          </TabsContent>
          <TabsContent
            value="decisions-remediation"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-decisions-remediation"
          >
            {props.panels.decisionsRemediation}
          </TabsContent>
          <TabsContent
            value="review-package"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-review-package"
          >
            {props.panels.reviewPackage}
          </TabsContent>
          <TabsContent
            value="architecture"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-architecture"
          >
            {props.panels.architecture}
          </TabsContent>
          <TabsContent
            value="activity"
            className="min-w-0 overflow-visible"
            data-testid="review-detail-workspace-panel-activity"
          >
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
