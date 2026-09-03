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

import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { useIncrementalReviewFindingsRefresh } from "@/hooks/use-incremental-review-findings-refresh";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_DEFAULT_TAB,
  REVIEW_DETAIL_FINDING_PARAM,
  REVIEW_DETAIL_TAB_LABELS,
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
import {
  type ResolveReviewDetailVisibleTabsInput,
} from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewWorkspaceTabForVisit,
  resolveReviewWorkspaceVisibleTabs,
} from "@/lib/resolve-review-workspace-visible-tabs";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import {
  type ArchitectureFindingsDualPaneDiagramNode,
  resolveFindingDiagramSelectionSync,
} from "@/lib/architecture/architecture-findings-dual-pane";
import { ReviewWorkbenchLayout, type ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import { ReviewPresenterSurface } from "@/components/reviews/ReviewPresenterSurface";
import {
  ReviewWorkbenchSelectionProvider,
  useReviewWorkbenchSelection,
} from "@/components/reviews/ReviewWorkbenchSelectionContext";
import { WorkbenchFindingSelectionSync } from "@/components/reviews/WorkbenchFindingSelectionSync";
import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { useReviewWorkbenchShortcuts } from "@/hooks/use-review-workbench-shortcuts";
import { useProfessionalWorkbenchEnabled } from "@/lib/workspace-mode/use-professional-workbench-enabled";
import {
  REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT,
  type ReviewWorkbenchDiagramNodesEventDetail,
} from "@/lib/workspace-mode/professional-workbench-preference";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";

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

function panelWithVocabularyRail(tabId: ReviewDetailTabId, vocabularyRail: ReactNode, panel: ReactNode): ReactNode {
  return (
    <>
      <Fragment key={`${tabId}-vocabulary-rail`}>{vocabularyRail}</Fragment>
      <Fragment key={`${tabId}-panel`}>{panel}</Fragment>
    </>
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

const WORKBENCH_TAB_IDS: readonly ReviewDetailTabId[] = ["architecture", "findings", "evidence"];

function isWorkbenchTab(tabId: ReviewDetailTabId): tabId is ReviewWorkbenchColumnId {
  return (WORKBENCH_TAB_IDS as readonly string[]).includes(tabId);
}

function readFindingRefFromDom(findingId: string): {
  readonly findingId: string;
  readonly title: string;
  readonly wireJson: string | null;
  readonly relatedNodeIds: readonly string[];
} {
  const card = document.querySelector<HTMLElement>(`[data-finding-id="${CSS.escape(findingId)}"]`);
  const title =
    card?.getAttribute("data-finding-title")?.trim()
    ?? card?.querySelector("h2,h3")?.textContent?.trim()
    ?? "";
  const relatedNodeIdsRaw = card?.getAttribute("data-finding-related-node-ids");
  const relatedNodeIds =
    relatedNodeIdsRaw?.split(",").map((id) => id.trim()).filter((id) => id.length > 0) ?? [];
  const wireJson = card?.getAttribute("data-finding-wire-json");

  return {
    findingId,
    title,
    wireJson: wireJson ?? null,
    relatedNodeIds,
  };
}

/** Shared finding selection: finding clicks, diagram highlight, evidence scroll (LI-09 / PT-12). */
function WorkbenchSelectionCoordinator(props: { readonly enabled: boolean }): null {
  const selection = useReviewWorkbenchSelection();
  const [diagramNodes, setDiagramNodes] = useState<readonly ArchitectureFindingsDualPaneDiagramNode[]>([]);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    const onDiagramNodes = (event: Event) => {
      const detail = (event as CustomEvent<ReviewWorkbenchDiagramNodesEventDetail>).detail;
      setDiagramNodes(detail?.nodes ?? []);
    };

    window.addEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);

    return () => window.removeEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);
  }, [props.enabled]);

  useEffect(() => {
    if (!props.enabled || selection === null) {
      return;
    }

    const selectedId = selection.selectedFindingId?.trim() ?? "";

    if (selectedId.length === 0) {
      selection.setHighlightedNodeId(null);

      return;
    }

    const findingRef = readFindingRefFromDom(selectedId);
    const sync = resolveFindingDiagramSelectionSync(findingRef, diagramNodes);

    selection.setHighlightedNodeId(sync.matchedNodeId);
  }, [diagramNodes, props.enabled, selection, selection?.selectedFindingId]);

  useEffect(() => {
    if (selection === null) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const card = target.closest<HTMLElement>("[data-finding-id]");

      if (card === null) {
        return;
      }

      const findingId = card.getAttribute("data-finding-id")?.trim() ?? "";

      if (findingId.length > 0) {
        selection.setSelectedFindingId(findingId);
      }
    };

    document.addEventListener("click", onClick, true);

    return () => document.removeEventListener("click", onClick, true);
  }, [selection]);

  useEffect(() => {
    if (!props.enabled || selection === null) {
      return;
    }

    const selectedId = selection.selectedFindingId?.trim() ?? "";
    const evidenceColumn = document.querySelector<HTMLElement>('[data-testid="review-workbench-column-evidence"]');

    if (evidenceColumn === null) {
      return;
    }

    const linkedRows = evidenceColumn.querySelectorAll<HTMLElement>("[data-linked-finding-id]");
    let matched = false;

    for (const row of linkedRows) {
      const linkedId = row.getAttribute("data-linked-finding-id")?.trim() ?? "";
      const isMatch = selectedId.length > 0 && linkedId === selectedId;

      row.setAttribute("data-workbench-evidence-selected", isMatch ? "true" : "false");

      if (isMatch) {
        matched = true;
        row.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    evidenceColumn.setAttribute(
      "data-workbench-evidence-empty",
      selectedId.length > 0 && !matched && linkedRows.length === 0 ? "true" : "false",
    );
  }, [props.enabled, selection, selection?.selectedFindingId]);

  useEffect(() => {
    if (props.enabled || selection === null) {
      return;
    }

    // Tab-only layout still restores ?findingId=; only drop workbench node highlight.
    selection.setHighlightedNodeId(null);
  }, [props.enabled, selection]);

  return null;
}

type WorkbenchLayoutBridgeProps = {
  readonly architecture: ReactNode;
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly focusColumn: ReviewWorkbenchColumnId | null;
  readonly onFocusColumn: (column: ReviewWorkbenchColumnId) => void;
  readonly onExitWorkbench: () => void;
};

function WorkbenchLayoutBridge(props: WorkbenchLayoutBridgeProps): React.JSX.Element {
  const selection = useReviewWorkbenchSelection();

  return (
    <ReviewWorkbenchLayout
      architecture={props.architecture}
      findings={props.findings}
      evidence={props.evidence}
      focusColumn={props.focusColumn}
      onFocusColumn={props.onFocusColumn}
      onExitWorkbench={props.onExitWorkbench}
      selectedFindingId={selection?.selectedFindingId ?? null}
      highlightedNodeId={selection?.highlightedNodeId ?? null}
    />
  );
}

/** Tabbed review workspace with URL-backed `reviewTab` selection. */
export function ReviewDetailWorkspace(props: ReviewDetailWorkspaceProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();
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
  const {
    isTabNewSinceLastVisit,
    markTabSeen,
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
  const workbenchEligible = WORKBENCH_TAB_IDS.every(
    (tabId) => resolved.visibleTabIds.includes(tabId) || resolved.moreTabIds.includes(tabId),
  );
  const workbenchVisible = workbench.enabled && workbenchEligible;
  const workbenchFocusColumn: ReviewWorkbenchColumnId | null = isWorkbenchTab(activeTab) ? activeTab : null;

  useReviewWorkbenchShortcuts({
    enabled: workbenchVisible,
    onFocusColumn: (column) => navigateTab(column, { workbenchFocus: column }),
  });

  const exitPresenter = useCallback(() => {
    writeReviewDetailTabToUrl(activeTab, {
      findingId: initialFindingId,
      workbenchFocus: initialWorkbenchFocus,
      presenter: null,
    });
    window.location.reload();
  }, [activeTab, initialFindingId, initialWorkbenchFocus]);

  const presenterBody =
    props.presenterFindingBody ?? (
      <div className="space-y-8" data-testid="review-presenter-body">
        {props.defensibilityStrip ?? null}
        {props.panels.findings}
        {props.panels.activity}
      </div>
    );

  const workspaceBody = (
    <ReviewDetailWorkspaceTabContext.Provider value={{ navigateTab }}>
      <div className="min-w-0 space-y-4" data-testid="review-detail-workspace">
        {props.defensibilityStrip ?? null}
        {isWorkingMode ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="review-presenter-enter"
              onClick={() => {
                writeReviewDetailTabToUrl(activeTab, {
                  findingId: initialFindingId,
                  workbenchFocus: initialWorkbenchFocus,
                  presenter: true,
                });
                window.location.reload();
              }}
            >
              Presenter
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

        {props.tabSectionNav ?? null}

        {workbenchVisible ? (
          <WorkbenchLayoutBridge
            architecture={panelWithInPipelineBanner(
              "architecture",
              props.panels.architecture,
              inPipelineBanner,
            )}
            findings={panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
            evidence={panelWithVocabularyRail(
              "evidence",
              <PackageEvidenceEvidenceGraphVocabularyRail
                runId={props.runId}
                currentSurfaceId="package-evidence"
              />,
              panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner),
            )}
            focusColumn={workbenchFocusColumn}
            onFocusColumn={(column) => navigateTab(column, { workbenchFocus: column })}
            onExitWorkbench={() => workbench.setEnabled(false)}
          />
        ) : null}
        <WorkbenchSelectionCoordinator enabled={workbenchVisible} />
        <WorkbenchFindingSelectionSync />

        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "overview")}
          data-testid="review-detail-workspace-panel-overview"
        >
          {panelWithInPipelineBanner("overview", props.panels.overview, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={workbenchVisible || panelHidden(activeTab, "findings")}
          data-testid="review-detail-workspace-panel-findings"
        >
          {panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={workbenchVisible || panelHidden(activeTab, "evidence")}
          data-testid="review-detail-workspace-panel-evidence"
        >
          {panelWithVocabularyRail(
            "evidence",
            <PackageEvidenceEvidenceGraphVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-evidence"
            />,
            panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner),
          )}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "policies")}
          data-testid="review-detail-workspace-panel-policies"
        >
          {panelWithVocabularyRail(
            "policies",
            <PackageGovernanceApprovalQueueVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-governance"
            />,
            panelWithInPipelineBanner("policies", props.panels.policies, inPipelineBanner),
          )}
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
          hidden={workbenchVisible || panelHidden(activeTab, "architecture")}
          data-testid="review-detail-workspace-panel-architecture"
        >
          {panelWithInPipelineBanner("architecture", props.panels.architecture, inPipelineBanner)}
        </div>
        <div
          className="min-w-0 overflow-visible"
          hidden={panelHidden(activeTab, "activity")}
          data-testid="review-detail-workspace-panel-activity"
        >
          {panelWithVocabularyRail(
            "activity",
            <PackageActivityAuditTrailVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-activity"
            />,
            props.panels.activity,
          )}
        </div>
      </div>
    </ReviewDetailWorkspaceTabContext.Provider>
  );

  if (presenterMode && isWorkingMode) {
    return (
      <ReviewPresenterSurface
        title={props.presenterFindingTitle ?? "Review in progress"}
        body={presenterBody}
        actions={props.presenterFindingActions}
        onExit={exitPresenter}
      />
    );
  }

  return (
    <ReviewWorkbenchSelectionProvider
      initialFindingId={initialFindingId}
      initialFocusColumn={initialWorkbenchFocus}
      onFindingIdChange={(findingId) => {
        writeReviewDetailTabToUrl(activeTab, {
          findingId,
          workbenchFocus: workbenchFocusColumn,
          presenter: null,
        });
      }}
      onFocusColumnChange={(column) => {
        writeReviewDetailTabToUrl(activeTab, {
          findingId: initialFindingId,
          workbenchFocus: column,
          presenter: null,
        });
      }}
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
