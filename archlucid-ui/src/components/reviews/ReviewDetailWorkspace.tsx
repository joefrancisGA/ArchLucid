"use client";

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
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
  type ResolveReviewDetailVisibleTabsInput,
} from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewWorkspaceTabForVisit,
  resolveReviewWorkspaceVisibleTabs,
} from "@/lib/resolve-review-workspace-visible-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";

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
  readonly lifecycle?: ReviewWorkspaceLifecycle;
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
      <Fragment key={`${tabId}-in-pipeline-banner`}>{inPipelineBanner}</Fragment>
      <Fragment key={`${tabId}-panel`}>{panel}</Fragment>
    </div>
  );
}

function resolveWorkspaceLifecycle(props: ReviewDetailWorkspaceProps): ReviewWorkspaceLifecycle {
  if (props.lifecycle !== undefined) {
    return props.lifecycle;
  }

  if (props.tabLifecycle !== undefined) {
    const manifestId = props.tabLifecycle.manifestId;

    if ((manifestId ?? "").trim().length > 0) {
      return "finalized";
    }

    if (props.tabLifecycle.showProgressTracker) {
      return "in-review";
    }
  }

  return "finalized";
}

function panelHidden(activeTab: ReviewDetailTabId, tabId: ReviewDetailTabId): boolean {
  return activeTab !== tabId;
}

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);
  const lifecycle = resolveWorkspaceLifecycle(props);
  const resolved = useMemo(() => {
    if (props.tabLifecycle !== undefined) {
      return resolveReviewWorkspaceVisibleTabs({
        ...props.tabLifecycle,
        lifecycle,
      });
    }

    return {
      stage: "committed" as const,
      visibleTabIds: Object.keys(REVIEW_DETAIL_TAB_LABELS) as ReviewDetailTabId[],
      advancedCollapsedTabIds: [] as ReviewDetailTabId[],
      defaultTabId: REVIEW_DETAIL_DEFAULT_TAB,
    };
  }, [lifecycle, props.tabLifecycle]);
  const rawTabParam = searchParams.get(REVIEW_DETAIL_TAB_PARAM);
  const searchParamTab =
    props.tabLifecycle !== undefined
      ? resolveReviewWorkspaceTabForVisit(rawTabParam, resolved, lifecycle)
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
        <ReviewWorkspaceTabStrip
          lifecycle={lifecycle}
          activeTab={activeTab}
          resolvedTabs={resolved}
          tabCounts={{
            findings: counts.findings,
            evidence: counts.evidence,
            decisionsRemediation: counts.decisionsRemediation,
          }}
          isTabNewSinceLastVisit={isTabNewSinceLastVisit}
          onTabChange={navigateTab}
        />

        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "overview")}
          data-testid="review-detail-workspace-panel-overview"
        >
          {panelWithInPipelineBanner("overview", props.panels.overview, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "findings")}
          data-testid="review-detail-workspace-panel-findings"
        >
          {panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "evidence")}
          data-testid="review-detail-workspace-panel-evidence"
        >
          <PackageEvidenceEvidenceGraphVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-evidence"
          />
          {panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "policies")}
          data-testid="review-detail-workspace-panel-policies"
        >
          <PackageGovernanceApprovalQueueVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-governance"
          />
          {panelWithInPipelineBanner("policies", props.panels.policies, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "decisions-remediation")}
          data-testid="review-detail-workspace-panel-decisions-remediation"
        >
          {panelWithInPipelineBanner(
            "decisions-remediation",
            props.panels.decisionsRemediation,
            inPipelineBanner,
          )}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "review-package")}
          data-testid="review-detail-workspace-panel-review-package"
        >
          {panelWithInPipelineBanner("review-package", props.panels.reviewPackage, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "architecture")}
          data-testid="review-detail-workspace-panel-architecture"
        >
          {panelWithInPipelineBanner("architecture", props.panels.architecture, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "activity")}
          data-testid="review-detail-workspace-panel-activity"
        >
          <PackageActivityAuditTrailVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-activity"
          />
          {props.panels.activity}
        </div>
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
