"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

import { ReviewPresenterSurface } from "@/components/reviews/ReviewPresenterSurface";
import { ReviewDetailWorkspaceTabShell } from "@/components/reviews/ReviewDetailWorkspaceTabShell";
import {
  ReviewWorkbenchSelectionProvider,
} from "@/components/reviews/ReviewWorkbenchSelectionContext";
import { useReviewDetailWorkspacePresenter } from "@/components/reviews/use-review-detail-workspace-presenter";
import { useReviewDetailWorkspaceSelection } from "@/components/reviews/use-review-detail-workspace-selection";
import { useReviewDetailWorkspaceTabs } from "@/components/reviews/use-review-detail-workspace-tabs";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  type ReviewDetailTabId,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";
import { type ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

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
  /** Tab-scoped "On this page" anchor nav rendered below the tab strip. */
  readonly tabSectionNav?: ReactNode | null;
  /** Asserted / inferred / skipped summary above workspace chrome. */
  readonly defensibilityStrip?: ReactNode | null;
  /** Primary finding title for presenter mode when a finding is selected. */
  readonly presenterFindingTitle?: string | null;
  readonly presenterFindingBody?: ReactNode | null;
  readonly presenterFindingActions?: ReactNode | null;
};

type ReviewDetailWorkspaceTabContextValue = {
  readonly navigateTab: (tab: ReviewDetailTabId) => void;
};

const ReviewDetailWorkspaceTabContext = createContext<ReviewDetailWorkspaceTabContextValue | null>(null);

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const tabs = useReviewDetailWorkspaceTabs(props);
  const presenter = useReviewDetailWorkspacePresenter();
  const selection = useReviewDetailWorkspaceSelection({
    activeTab: tabs.activeTab,
    initialFindingId: tabs.initialFindingId,
    workbenchFocusColumn: tabs.workbenchFocusColumn,
  });

  const presenterBody =
    props.presenterFindingBody ?? (
      <div className="space-y-8" data-testid="review-presenter-body">
        {props.defensibilityStrip ?? null}
        {props.panels.findings}
        {props.panels.activity}
      </div>
    );

  const workspaceBody = (
    <ReviewDetailWorkspaceTabContext.Provider value={{ navigateTab: tabs.navigateTab }}>
      <ReviewDetailWorkspaceTabShell
        props={props}
        tabs={tabs}
        navigateTab={tabs.navigateTab}
        onEnterPresenter={presenter.enterPresenter}
      />
    </ReviewDetailWorkspaceTabContext.Provider>
  );

  if (tabs.presenterMode && isWorkingMode) {
    return (
      <ReviewPresenterSurface
        title={props.presenterFindingTitle ?? "Review in progress"}
        body={presenterBody}
        actions={props.presenterFindingActions}
        onExit={presenter.exitPresenter}
      />
    );
  }

  return (
    <ReviewWorkbenchSelectionProvider
      initialFindingId={tabs.initialFindingId}
      initialFocusColumn={tabs.initialWorkbenchFocus}
      onFindingIdChange={selection.onFindingIdChange}
      onFocusColumnChange={selection.onFocusColumnChange}
    >
      {workspaceBody}
    </ReviewWorkbenchSelectionProvider>
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
