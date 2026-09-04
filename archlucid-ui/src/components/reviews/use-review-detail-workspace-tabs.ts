"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { useIncrementalReviewFindingsRefresh } from "@/hooks/use-incremental-review-findings-refresh";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_FINDING_PARAM,
  REVIEW_DETAIL_TAB_PARAM,
  REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM,
  type ReviewDetailTabId,
  readPresenterModeFromSearchParams,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
  resolveReviewWorkbenchFocusColumn,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";
import { type ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewWorkspaceTabForVisit,
  resolveReviewWorkspaceVisibleTabs,
} from "@/lib/resolve-review-workspace-visible-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import { useReviewWorkbenchShortcuts } from "@/hooks/use-review-workbench-shortcuts";
import { useProfessionalWorkbenchEnabled } from "@/lib/workspace-mode/use-professional-workbench-enabled";

import type { ReviewDetailWorkspaceProps } from "@/components/reviews/ReviewDetailWorkspace";

const WORKBENCH_TAB_IDS: readonly ReviewDetailTabId[] = ["architecture", "findings", "evidence"];

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

function isWorkbenchTab(tabId: ReviewDetailTabId): tabId is ReviewWorkbenchColumnId {
  return (WORKBENCH_TAB_IDS as readonly string[]).includes(tabId);
}

export type UseReviewDetailWorkspaceTabsResult = {
  readonly activeTab: ReviewDetailTabId;
  readonly navigateTab: (
    tab: ReviewDetailTabId,
    options?: { readonly findingId?: string | null; readonly workbenchFocus?: ReviewWorkbenchColumnId | null },
  ) => void;
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly resolved: ReturnType<typeof resolveReviewWorkspaceVisibleTabs>;
  readonly isTabNewSinceLastVisit: (tab: ReviewDetailTabId) => boolean;
  readonly workbenchVisible: boolean;
  readonly workbenchFocusColumn: ReviewWorkbenchColumnId | null;
  readonly setWorkbenchEnabled: (enabled: boolean) => void;
  readonly initialFindingId: string | null;
  readonly initialWorkbenchFocus: ReviewWorkbenchColumnId | null;
  readonly presenterMode: boolean;
  readonly pipelineInFlight: boolean;
  readonly inPipelineBanner: ReviewDetailWorkspaceProps["inPipelineBanner"];
  readonly counts: NonNullable<ReviewDetailWorkspaceProps["tabCounts"]>;
};

export function useReviewDetailWorkspaceTabs(
  props: ReviewDetailWorkspaceProps,
): UseReviewDetailWorkspaceTabsResult {
  const searchParams = useSearchParams();
  const urlFindingId = searchParams.get(REVIEW_DETAIL_FINDING_PARAM)?.trim() ?? "";
  const initialFindingId = urlFindingId.length > 0 ? urlFindingId : null;
  const initialWorkbenchFocus = resolveReviewWorkbenchFocusColumn(
    searchParams.get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
  );
  const presenterMode = readPresenterModeFromSearchParams(searchParams);
  const [hashResolved, setHashResolved] = useState(false);
  const lifecycle = resolveWorkspaceLifecycle(props);
  const resolved = useMemo(() => {
    if (props.tabLifecycle !== undefined) {
      return resolveReviewWorkspaceVisibleTabs({
        ...props.tabLifecycle,
        lifecycle,
      });
    }

    const fallbackInput =
      lifecycle === "in-review"
        ? { manifestId: null, showProgressTracker: true, runCompleted: false }
        : { manifestId: "fallback-manifest", showProgressTracker: false, runCompleted: false };

    return resolveReviewWorkspaceVisibleTabs({ ...fallbackInput, lifecycle });
  }, [lifecycle, props.tabLifecycle]);
  const rawTabParam = searchParams.get(REVIEW_DETAIL_TAB_PARAM);
  const searchParamTab =
    props.tabLifecycle !== undefined
      ? resolveReviewWorkspaceTabForVisit(rawTabParam, resolved, lifecycle)
      : resolveReviewDetailTab(rawTabParam);
  const [activeTab, setActiveTab] = useState<ReviewDetailTabId>(searchParamTab);
  const tabActivityAt = props.tabActivityAt ?? {};
  const { isTabNewSinceLastVisit, markTabSeen } = useReviewDetailLastVisited(props.runId, tabActivityAt);

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
    (tab: ReviewDetailTabId, options?: { readonly findingId?: string | null; readonly workbenchFocus?: ReviewWorkbenchColumnId | null }) => {
      setActiveTab(tab);
      writeReviewDetailTabToUrl(tab, {
        hash: null,
        findingId: options?.findingId,
        workbenchFocus: options?.workbenchFocus ?? (isWorkbenchTab(tab) ? tab : null),
        presenter: presenterMode ? true : null,
      });
      markTabSeen(tab);
    },
    [markTabSeen, presenterMode],
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
  const pipelineInFlight =
    props.tabLifecycle?.showProgressTracker === true && props.tabLifecycle.runCompleted !== true;

  useIncrementalReviewFindingsRefresh({
    runId: props.runId,
    enabled: pipelineInFlight,
  });

  const workbench = useProfessionalWorkbenchEnabled();
  const workbenchVisible =
    workbench.mounted
    && workbench.enabled
    && WORKBENCH_TAB_IDS.every(
      (tabId) => resolved.visibleTabIds.includes(tabId) || resolved.moreTabIds.includes(tabId),
    );
  const workbenchFocusFromUrl = resolveReviewWorkbenchFocusColumn(
    searchParams.get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
  );
  const workbenchFocusColumn: ReviewWorkbenchColumnId | null =
    workbenchFocusFromUrl ?? (isWorkbenchTab(activeTab) ? activeTab : null);

  useReviewWorkbenchShortcuts({
    enabled: workbenchVisible,
    onFocusColumn: (column) => navigateTab(column, { workbenchFocus: column }),
  });

  return {
    activeTab,
    navigateTab,
    lifecycle,
    resolved,
    isTabNewSinceLastVisit,
    workbenchVisible,
    workbenchFocusColumn,
    setWorkbenchEnabled: workbench.setEnabled,
    initialFindingId,
    initialWorkbenchFocus,
    presenterMode,
    pipelineInFlight,
    inPipelineBanner,
    counts,
  };
}

export { isWorkbenchTab, WORKBENCH_TAB_IDS };
