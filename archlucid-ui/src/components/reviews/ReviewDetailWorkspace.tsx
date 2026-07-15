"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewDetailWorkspaceOrientation } from "@/components/reviews/ReviewDetailWorkspaceOrientation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isReviewDetailOverflowTabId,
  REVIEW_DETAIL_OVERFLOW_TAB_IDS,
  REVIEW_DETAIL_PRIMARY_TAB_IDS,
  reviewDetailTabLabel,
} from "@/lib/review-detail-workspace-tab-groups";
import {
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
} from "@/lib/review-detail-workspace-tabs";
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
  readonly tabCounts?: ReviewDetailTabCounts;
  readonly panels: ReviewDetailWorkspacePanels;
  readonly showPackageWorkflowOrientation?: boolean;
};

function tabCountBadge(count: number | null | undefined, tabId: ReviewDetailTabId): number | null {
  if (count === null || count === undefined || count <= 0) {
    return null;
  }

  if (tabId === "findings" || tabId === "evidence" || tabId === "decisions-remediation") {
    return count;
  }

  return null;
}

function TabTriggerWithBadge(props: {
  readonly tabId: ReviewDetailTabId;
  readonly count: number | null;
}): React.JSX.Element {
  return (
    <TabsTrigger
      value={props.tabId}
      data-testid={`review-detail-workspace-tab-${props.tabId}`}
      title={reviewDetailTabLabel(props.tabId)}
    >
      {reviewDetailTabLabel(props.tabId)}
      {props.count !== null ? (
        <span
          className={cn(
            "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {props.count}
        </span>
      ) : null}
    </TabsTrigger>
  );
}

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));
  const overflowActive = isReviewDetailOverflowTabId(activeTab);

  const navigateTab = useCallback(
    (tab: ReviewDetailTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(REVIEW_DETAIL_TAB_PARAM, tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setMoreOpen(false);
    },
    [pathname, router, searchParams],
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

    const params = new URLSearchParams(searchParams.toString());
    params.set(REVIEW_DETAIL_TAB_PARAM, tabFromHash);
    router.replace(`${pathname}?${params.toString()}#${hash}`, { scroll: false });
    setHashResolved(true);
  }, [hashResolved, pathname, router, searchParams]);

  const counts = props.tabCounts ?? {};

  const countForTab = (tabId: ReviewDetailTabId): number | null => {
    if (tabId === "findings") {
      return tabCountBadge(counts.findings, tabId);
    }

    if (tabId === "evidence") {
      return tabCountBadge(counts.evidence, tabId);
    }

    if (tabId === "decisions-remediation") {
      return tabCountBadge(counts.decisionsRemediation, tabId);
    }

    return null;
  };

  return (
    <div className="space-y-3" data-testid="review-detail-workspace">
      {props.showPackageWorkflowOrientation === true ? <ReviewDetailWorkspaceOrientation /> : null}

      <Tabs value={activeTab} onValueChange={(value) => navigateTab(resolveReviewDetailTab(value))}>
        <TabsList
          aria-label="Review workspace sections"
          data-testid="review-detail-workspace-tabs"
          className="flex flex-wrap gap-x-1 gap-y-1"
        >
          {REVIEW_DETAIL_PRIMARY_TAB_IDS.map((tabId) => (
            <TabTriggerWithBadge key={tabId} tabId={tabId} count={countForTab(tabId)} />
          ))}

          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger
              type="button"
              data-testid="review-detail-workspace-tab-more-trigger"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={cn(
                "relative px-4 py-2 text-[13px] font-medium leading-none outline-none transition-colors",
                "-mb-px border-b-2",
                overflowActive
                  ? "border-teal-600 text-al-text-primary dark:border-teal-400 dark:text-teal-300"
                  : "border-transparent text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100",
                "focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
              )}
            >
              {overflowActive ? `More: ${reviewDetailTabLabel(activeTab)}` : "More sections"}
            </PopoverTrigger>
            <PopoverContent
              role="menu"
              aria-label="Additional review sections"
              data-testid="review-detail-workspace-tab-more-menu"
              className="relative right-auto left-0 min-w-[14rem] p-2"
            >
              <ul className="m-0 list-none space-y-1 p-0">
                {REVIEW_DETAIL_OVERFLOW_TAB_IDS.map((tabId) => {
                  const selected = activeTab === tabId;

                  return (
                    <li key={tabId}>
                      <button
                        type="button"
                        role="menuitem"
                        data-testid={`review-detail-workspace-tab-${tabId}`}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm",
                          selected
                            ? "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
                            : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                        )}
                        aria-current={selected ? "page" : undefined}
                        onClick={() => navigateTab(tabId)}
                      >
                        {reviewDetailTabLabel(tabId)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        </TabsList>

        <TabsContent value="overview" data-testid="review-detail-workspace-panel-overview">
          {props.panels.overview}
        </TabsContent>
        <TabsContent value="findings" data-testid="review-detail-workspace-panel-findings">
          {props.panels.findings}
        </TabsContent>
        <TabsContent value="evidence" data-testid="review-detail-workspace-panel-evidence">
          {props.panels.evidence}
        </TabsContent>
        <TabsContent value="policies" data-testid="review-detail-workspace-panel-policies">
          {props.panels.policies}
        </TabsContent>
        <TabsContent value="decisions-remediation" data-testid="review-detail-workspace-panel-decisions-remediation">
          {props.panels.decisionsRemediation}
        </TabsContent>
        <TabsContent value="review-package" data-testid="review-detail-workspace-panel-review-package">
          {props.panels.reviewPackage}
        </TabsContent>
        <TabsContent value="architecture" data-testid="review-detail-workspace-panel-architecture">
          {props.panels.architecture}
        </TabsContent>
        <TabsContent value="activity" data-testid="review-detail-workspace-panel-activity">
          {props.panels.activity}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function useReviewDetailTabNavigation(): (tab: ReviewDetailTabId) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (tab: ReviewDetailTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(REVIEW_DETAIL_TAB_PARAM, tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}
