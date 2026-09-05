"use client";

import {
  REVIEW_WORKSPACE_TAB_STRIP_TEST_ID,
} from "@/components/reviews/ReviewWorkspaceShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { readCachedUserPreferencesForMutators } from "@/lib/api/user-preferences";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewDetailVisibleTabs } from "@/lib/resolve-review-detail-visible-tabs";
import { resolveReviewWorkspaceTabLabel } from "@/lib/resolve-review-workspace-tab-label";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewDetailTab,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

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
  readonly showThisBrowserVisitHonesty?: boolean;
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

function evidenceTabAriaLabel(count: number): string {
  return `${count} evidence item${count === 1 ? "" : "s"} · this review · evidence tab`;
}

function architectureTabAriaLabel(count: number): string {
  return `${count} architecture diagram${count === 1 ? "" : "s"} · this review · architecture tab`;
}

function tabCountAriaLabel(tabId: ReviewDetailTabId, count: number): string {
  if (tabId === "decisions-remediation") {
    return clarificationsTabAriaLabel(count);
  }

  if (tabId === "findings") {
    return findingsTabAriaLabel(count);
  }

  if (tabId === "evidence") {
    return evidenceTabAriaLabel(count);
  }

  if (tabId === "architecture") {
    return architectureTabAriaLabel(count);
  }

  return `${count}`;
}

function tabOptionLabel(
  lifecycle: ReviewWorkspaceLifecycle,
  tabId: ReviewDetailTabId,
  count: number | null,
): string {
  const baseLabel = resolveReviewWorkspaceTabLabel(lifecycle, tabId);

  if (count === null) {
    return baseLabel;
  }

  return `${baseLabel} (${count})`;
}

function renderTabTrigger(
  props: ReviewWorkspaceTabStripProps,
  tabId: ReviewDetailTabId,
  counts: ReviewWorkspaceTabCounts,
): React.JSX.Element {
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
          <NewSinceLastVisitMarker
            testId={`review-detail-tab-new-${tabId}`}
            showThisBrowserHonesty={props.showThisBrowserVisitHonesty}
          />
        ) : null}
      </span>
      {count !== null ? (
        <span
          className={cn(
            "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          aria-label={tabCountAriaLabel(tabId, count)}
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
}

/** TB-2367 — single tab list for create-home and committed review workspace lifecycles. */
function ReviewWorkspaceTabDivider(): React.JSX.Element {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-hidden
      className="mx-1 hidden h-6 w-px shrink-0 self-center bg-neutral-300 md:inline-block dark:bg-neutral-700"
      data-testid="review-detail-workspace-tab-divider"
    />
  );
}

export function ReviewWorkspaceTabStrip(props: ReviewWorkspaceTabStripProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const deskContinuityExplicit = readCachedUserPreferencesForMutators().deskContinuityIsExplicit;
  const showThisBrowserVisitHonesty =
    props.showThisBrowserVisitHonesty ?? (!isWorkingMode || !deskContinuityExplicit);
  const stripProps: ReviewWorkspaceTabStripProps = {
    ...props,
    showThisBrowserVisitHonesty,
  };
  const counts = props.tabCounts ?? {};
  const tabsVariant = props.lifecycle === "create-home" ? "pill" : "line";
  const primaryTabIds = props.resolvedTabs.visibleTabIds;
  const secondaryTabIds = props.resolvedTabs.moreTabIds;
  const allTabIds = [...primaryTabIds, ...secondaryTabIds];

  return (
    <div className="space-y-2" data-testid={REVIEW_WORKSPACE_TAB_STRIP_TEST_ID}>
      <div className="md:hidden">
        <Label htmlFor="review-detail-workspace-sections-select" className={OPERATOR_TYPOGRAPHY.helper}>
          Review section
        </Label>
        <select
          id="review-detail-workspace-sections-select"
          className={cn(
            "mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.body,
          )}
          value={props.activeTab}
          data-testid="review-detail-workspace-sections-select"
          onChange={(event) => {
            props.onTabChange(resolveReviewDetailTab(event.target.value));
          }}
        >
          {primaryTabIds.length > 0 ? (
            <optgroup label="Primary sections">
              {primaryTabIds.map((tabId) => {
                const count = countForTab(tabId, counts);

                return (
                  <option key={tabId} value={tabId}>
                    {tabOptionLabel(props.lifecycle, tabId, count)}
                  </option>
                );
              })}
            </optgroup>
          ) : null}
          {secondaryTabIds.length > 0 ? (
            <optgroup label="Additional sections">
              {secondaryTabIds.map((tabId) => {
                const count = countForTab(tabId, counts);

                return (
                  <option key={tabId} value={tabId}>
                    {tabOptionLabel(props.lifecycle, tabId, count)}
                  </option>
                );
              })}
            </optgroup>
          ) : null}
        </select>
      </div>

      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
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
              tabsVariant === "line" ? "h-auto flex-wrap overflow-y-hidden" : "flex-wrap",
              "-mx-1 overflow-x-auto px-1",
            )}
          >
            {primaryTabIds.map((tabId) => renderTabTrigger(stripProps, tabId, counts))}
            {secondaryTabIds.length > 0 ? (
              <>
                <ReviewWorkspaceTabDivider />
                <span
                  className={cn(
                    "hidden shrink-0 self-center pr-1 text-al-text-secondary md:inline",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  data-testid="review-detail-workspace-tab-additional-label"
                >
                  Additional
                </span>
              </>
            ) : null}
            {secondaryTabIds.map((tabId) => renderTabTrigger(stripProps, tabId, counts))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
