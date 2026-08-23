"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveReviewWorkspaceTabLabel } from "@/lib/resolve-review-workspace-tab-label";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  isReviewDetailTabAdvanced,
  type ReviewDetailVisibleTabs,
} from "@/lib/resolve-review-detail-visible-tabs";
import {
  resolveReviewDetailTab,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

import {
  REVIEW_WORKSPACE_TAB_STRIP_TEST_ID,
} from "@/components/reviews/ReviewWorkspaceShell";

export const REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID = "review-detail-workspace-tabs";

export type ReviewWorkspaceTabCounts = {
  readonly findings?: number | null;
  readonly evidence?: number | null;
  readonly decisionsRemediation?: number | null;
  readonly architecture?: number | null;
};

export type ReviewWorkspaceTabStripProps = {
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly activeTab: ReviewDetailTabId;
  readonly resolvedTabs: ReviewDetailVisibleTabs;
  readonly tabCounts?: ReviewWorkspaceTabCounts;
  readonly isTabNewSinceLastVisit?: (tabId: ReviewDetailTabId) => boolean;
  readonly onTabChange: (tab: ReviewDetailTabId) => void;
};

function tabCountBadge(
  count: number | null | undefined,
  tabId: ReviewDetailTabId,
): number | null {
  if (count === null || count === undefined || count <= 0) {
    return null;
  }

  if (
    tabId === "findings"
    || tabId === "evidence"
    || tabId === "decisions-remediation"
    || tabId === "architecture"
  ) {
    return count;
  }

  return null;
}

function countForTab(
  tabId: ReviewDetailTabId,
  counts: ReviewWorkspaceTabCounts,
): number | null {
  if (tabId === "findings") {
    return tabCountBadge(counts.findings, tabId);
  }

  if (tabId === "evidence") {
    return tabCountBadge(counts.evidence, tabId);
  }

  if (tabId === "decisions-remediation") {
    return tabCountBadge(counts.decisionsRemediation, tabId);
  }

  if (tabId === "architecture") {
    return tabCountBadge(counts.architecture, tabId);
  }

  return null;
}

function clarificationsTabAriaLabel(count: number): string {
  return `${count} open clarification${count === 1 ? "" : "s"} · clarifications tab`;
}

function findingsTabAriaLabel(count: number): string {
  return `${count} assessment finding${count === 1 ? "" : "s"} · this review · findings tab`;
}

/** TB-2367 — single tab list for create-home and committed review workspace lifecycles. */
export function ReviewWorkspaceTabStrip(props: ReviewWorkspaceTabStripProps): React.JSX.Element {
  const counts = props.tabCounts ?? {};
  const tabsVariant = props.lifecycle === "create-home" ? "pill" : "line";

  return (
    <div
      className="-mx-1 overflow-x-auto px-1"
      data-testid={REVIEW_WORKSPACE_TAB_STRIP_TEST_ID}
    >
      <Tabs
        className="min-w-0"
        variant={tabsVariant}
        value={props.activeTab}
        onValueChange={(value) => props.onTabChange(resolveReviewDetailTab(value))}
      >
        <TabsList
          aria-label="Review workspace sections"
          data-testid={REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID}
          className={cn(
            tabsVariant === "line" ? "overflow-y-hidden" : undefined,
            "-mx-1 overflow-x-auto px-1",
          )}
        >
          {props.resolvedTabs.visibleTabIds.map((tabId) => {
            const count = countForTab(tabId, counts);

            return (
              <TabsTrigger
                key={tabId}
                value={tabId}
                data-testid={`review-detail-workspace-tab-${tabId}`}
                className="whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-2">
                  {resolveReviewWorkspaceTabLabel(props.lifecycle, tabId)}
                  {props.isTabNewSinceLastVisit?.(tabId) === true ? (
                    <NewSinceLastVisitMarker testId={`review-detail-tab-new-${tabId}`} />
                  ) : null}
                </span>
                {count !== null ? (
                  <span
                    className={cn(
                      "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                    aria-label={
                      tabId === "decisions-remediation"
                        ? clarificationsTabAriaLabel(count)
                        : tabId === "findings"
                          ? findingsTabAriaLabel(count)
                          : undefined
                    }
                    data-testid={
                      tabId === "decisions-remediation"
                        ? "architecture-workspace-clarifications-count"
                        : tabId === "architecture"
                          ? "architecture-workspace-diagram-count"
                          : tabId === "findings"
                            ? "architecture-workspace-findings-count"
                            : undefined
                    }
                  >
                    {count}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {props.resolvedTabs.advancedCollapsedTabIds.length > 0 ? (
          <details
            className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
            open={isReviewDetailTabAdvanced(props.activeTab, props.resolvedTabs) ? true : undefined}
            data-testid="review-detail-workspace-more-tabs"
          >
            <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
              More sections
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {props.resolvedTabs.advancedCollapsedTabIds.map((tabId) => {
                const count = countForTab(tabId, counts);

                return (
                  <Button
                    key={tabId}
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={`review-detail-workspace-tab-${tabId}`}
                    aria-current={props.activeTab === tabId ? "page" : undefined}
                    onClick={() => props.onTabChange(tabId)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {resolveReviewWorkspaceTabLabel(props.lifecycle, tabId)}
                      {props.isTabNewSinceLastVisit?.(tabId) === true ? (
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
      </Tabs>
    </div>
  );
}
