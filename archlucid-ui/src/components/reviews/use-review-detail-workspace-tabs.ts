"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { useIncrementalReviewFindingsRefresh } from "@/hooks/use-incremental-review-findings-refresh";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_FINDING_PARAM,
  REVIEW_DETAIL_TAB_PARAM,
  REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM,
  type ReviewDetailTabId,
  readPresenterModeFromWindowLocation,
  readReviewDetailFindingIdFromWindowLocation,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTabFromHash,
  resolveReviewDetailTabFromLocation,
  resolveReviewWorkbenchFocusColumn,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";
import { type ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewWorkspaceTabFromSearchParams,
  resolveReviewWorkspaceVisibleTabs} from "@/lib/resolve-review-workspace-visible-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import { useReviewWorkbenchShortcuts } from "@/hooks/use-review-workbench-shortcuts";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useProfessionalWorkbenchEnabled } from "@/lib/workspace-mode/use-professional-workbench-enabled";
import { readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

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
  const { isWorkingMode } = useWorkspaceMode();
  const initialFindingId = readReviewDetailFindingIdFromWindowLocation();
  const initialWorkbenchFocus = resolveReviewWorkbenchFocusColumn(
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
  );
  const [presenterMode, setPresenterModeState] = useState(() => readPresenterModeFromWindowLocation());
  const presenterModeRef = useRef(presenterMode);
  presenterModeRef.current = presenterMode;
  const [hashResolved, setHashResolved] = useState(false);
  const lifecycle = resolveWorkspaceLifecycle(props);
  const resolved = useMemo(() => {
    if (props.tabLifecycle !== undefined) {
      return resolveReviewWorkspaceVisibleTabs({
        ...props.tabLifecycle,
        lifecycle,
        workingDesk: isWorkingMode});
    }

    const fallbackInput =
      lifecycle === "in-review"
        ? { manifestId: null, showProgressTracker: true, runCompleted: false }
        : { manifestId: "fallback-manifest", showProgressTracker: false, runCompleted: false };

    return resolveReviewWorkspaceVisibleTabs({ ...fallbackInput, lifecycle, workingDesk: isWorkingMode });
  }, [isWorkingMode, lifecycle, props.tabLifecycle]);
  const rawReviewTabParam =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(REVIEW_DETAIL_TAB_PARAM);
  const rawArchTabParam =
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("archTab");
  const searchParamTab =
    props.tabLifecycle !== undefined
      ? resolveReviewWorkspaceTabFromSearchParams(new URLSearchParams(readWindowLocationSearch()), resolved, lifecycle)
      : resolveReviewDetailTabFromLocation(rawReviewTabParam, rawArchTabParam);
  const [activeTab, setActiveTab] = useState<ReviewDetailTabId>(searchParamTab);
  const [workbenchFocusColumn, setWorkbenchFocusColumnState] = useState<ReviewWorkbenchColumnId | null>(
    () => {
      const fromUrl = resolveReviewWorkbenchFocusColumn(
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
      );

      if (fromUrl !== null) {
        return fromUrl;
      }

      return isWorkbenchTab(searchParamTab) ? searchParamTab : null;
    },
  );
  const workbenchFocusColumnRef = useRef(workbenchFocusColumn);
  workbenchFocusColumnRef.current = workbenchFocusColumn;
  const tabActivityAt = props.tabActivityAt ?? {};
  const { isTabNewSinceLastVisit, markTabSeen } = useReviewDetailLastVisited(props.runId, tabActivityAt);

  useEffect(() => {
    const syncActiveTabFromUrl = (): void => {
      const nextTab = readReviewDetailTabFromWindowLocation();

      setActiveTab((current) => (current === nextTab ? current : nextTab));

      const nextPresenterMode = readPresenterModeFromWindowLocation();

      if (presenterModeRef.current !== nextPresenterMode) {
        presenterModeRef.current = nextPresenterMode;
        setPresenterModeState(nextPresenterMode);
      }

      const nextWorkbenchFocus = resolveReviewWorkbenchFocusColumn(
        new URLSearchParams(window.location.search).get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
      );
      const normalizedFocus = nextWorkbenchFocus ?? (isWorkbenchTab(nextTab) ? nextTab : null);

      if (workbenchFocusColumnRef.current !== normalizedFocus) {
        workbenchFocusColumnRef.current = normalizedFocus;
        setWorkbenchFocusColumnState(normalizedFocus);
      }
    };

    syncActiveTabFromUrl();
    window.addEventListener("popstate", syncActiveTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncActiveTabFromUrl);
    };
  }, []);

  const navigateTab = useCallback(
    (tab: ReviewDetailTabId, options?: { readonly findingId?: string | null; readonly workbenchFocus?: ReviewWorkbenchColumnId | null }) => {
      const nextWorkbenchFocus = options?.workbenchFocus ?? (isWorkbenchTab(tab) ? tab : null);

      setActiveTab(tab);
      setWorkbenchFocusColumnState(nextWorkbenchFocus);
      workbenchFocusColumnRef.current = nextWorkbenchFocus;
      writeReviewDetailTabToUrl(tab, {
        hash: null,
        findingId: options?.findingId,
        workbenchFocus: nextWorkbenchFocus,
        presenter: presenterModeRef.current ? true : null,
      });
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
  }, [activeTab]);

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
    enabled: pipelineInFlight});

  const workbench = useProfessionalWorkbenchEnabled();
  const workbenchVisible =
    workbench.mounted
    && workbench.enabled
    && WORKBENCH_TAB_IDS.every(
      (tabId) => resolved.visibleTabIds.includes(tabId) || resolved.moreTabIds.includes(tabId),
    );

  useReviewWorkbenchShortcuts({
    enabled: workbenchVisible,
    onFocusColumn: (column) => navigateTab(column, { workbenchFocus: column })});

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
    counts};
}

export { isWorkbenchTab, WORKBENCH_TAB_IDS };
