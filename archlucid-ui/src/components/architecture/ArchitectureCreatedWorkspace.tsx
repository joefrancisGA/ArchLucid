"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ArchitectureCreatedClarificationsPanel } from "@/components/architecture/ArchitectureCreatedClarificationsPanel";
import { useReviewClarificationQuestions } from "@/hooks/use-review-clarification-questions";
import { ArchitectureCreatedFindingsNextAction } from "@/components/architecture/ArchitectureCreatedFindingsNextAction";
import { ArchitectureCreatedCompactFirstViewport } from "@/components/architecture/ArchitectureCreatedCompactFirstViewport";
import { ArchitectureCreatedOverviewPanel } from "@/components/architecture/ArchitectureCreatedOverviewPanel";
import { ArchitectureCreatedOverviewBuyerChrome } from "@/components/architecture/ArchitectureCreatedOverviewBuyerChrome";
import { ArchitectureCreatedWorkspaceHeader } from "@/components/architecture/ArchitectureCreatedWorkspaceHeader";
import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import { ArchitectureFindingsDualPane } from "@/components/architecture/ArchitectureFindingsDualPane";
import { ClarificationsFindingsVocabularyRail } from "@/components/ClarificationsFindingsVocabularyRail";
import { OverviewDiagramVocabularyRail } from "@/components/OverviewDiagramVocabularyRail";
import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import {
  ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_OFF_LABEL,
  ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_ON_LABEL,
  resolveArchitectureFindingsDualPaneLayoutMode,
} from "@/lib/architecture/architecture-findings-dual-pane";
import {
  architectureFindingsLinkedViewHrefFromSearch,
  parseArchitectureFindingsLinkedViewFromSearch,
} from "@/lib/architecture/architecture-findings-linked-view-url";
import { Button } from "@/components/ui/button";
import {
  countClarificationGaps,
  countOpenClarifications,
  countOpenQuestionEntities,
} from "@/lib/architecture/architecture-open-clarifications-count";
import {
  buildArchitectureCreatedHomeModel,
  mergeArchitectureCreatedHomeInput,
  type BuildArchitectureCreatedHomeModelInput,
} from "@/lib/architecture/architecture-created-home-model";
import { readArchitectureCreationHandoff } from "@/lib/architecture/architecture-creation-handoff";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import {
  ARCHITECTURE_WORKSPACE_TAB_PARAM,
  type ArchitectureWorkspaceTabId,
  resolveArchitectureWorkspaceTabFromHash,
  resolveArchitectureWorkspaceTab,
  resolveArchitectureWorkspaceTabFromSearchParams,
} from "@/lib/architecture/architecture-workspace-tabs";
import {
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { mapArchitectureTabToReviewTab } from "@/lib/unified-review-workspace-tabs";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHITECTURE_CREATED_OVERVIEW_PRIMARY_CONTENT_ID,
  ARCHITECTURE_CREATED_OVERVIEW_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_OVERVIEW_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-created-overview-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { resolveReviewWorkspaceVisibleTabs } from "@/lib/resolve-review-workspace-visible-tabs";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type ArchitectureCreatedWorkspacePanels = {
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly governance: ReactNode;
  readonly activity: ReactNode;
  readonly submittedArchitecture: ReactNode;
};

export type ArchitectureCreatedWorkspaceProps = {
  readonly baseline: BuildArchitectureCreatedHomeModelInput;
  readonly architectureSourceText: string;
  readonly canEditDiagram: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly findingsTriageVisibleCount?: number;
  readonly panels: ArchitectureCreatedWorkspacePanels;
  readonly correctionHref: string | null;
  readonly analysisStagesComplete?: boolean;
  /** When Do this next owns the page primary, demote tab-scoped filled CTAs below the strip. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function resolveUserAssertions(
  merged: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreationUserAssertions {
  return {
    architectureName: merged.architectureName,
    architectureOverview: merged.architectureOverview,
    businessOutcome: merged.businessOutcome,
    peopleAndSystems: merged.peopleAndSystems,
  };
}

/** Tabbed post-creation architecture workspace with compact first viewport and lazy tab panels. */
export function ArchitectureCreatedWorkspace(props: ArchitectureCreatedWorkspaceProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlLinkedView = parseArchitectureFindingsLinkedViewFromSearch(searchParams.get("linkedView"));
  const [hashResolved, setHashResolved] = useState(false);
  const [dismissedClarificationGapIds, setDismissedClarificationGapIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [diagramInferredCount, setDiagramInferredCount] = useState(0);
  const { isWorkingMode } = useWorkspaceMode();
  const [showFindingsLinkedView, setShowFindingsLinkedViewState] = useState(urlLinkedView);
  const [diagramNodes, setDiagramNodes] = useState<readonly { id: string; label: string }[]>([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const linkedLayoutMode = resolveArchitectureFindingsDualPaneLayoutMode(showFindingsLinkedView);

  const setShowFindingsLinkedView = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      setShowFindingsLinkedViewState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (pathname !== null) {
          router.replace(
            architectureFindingsLinkedViewHrefFromSearch(searchParams.toString(), next, pathname),
            { scroll: false },
          );
        }

        return next;
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setShowFindingsLinkedViewState(urlLinkedView);
  }, [urlLinkedView]);

  useEffect(() => {
    if (isWorkingMode) {
      setShowFindingsLinkedView(true);
    }
  }, [isWorkingMode, setShowFindingsLinkedView]);

  const clarificationQuestionsQuery = useReviewClarificationQuestions({
    runId: props.baseline.runId,
    priorRunId: props.baseline.clarificationPriorRunId ?? null,
  });

  const merged = useMemo(() => {
    const snapshot = readArchitectureCreationHandoff(props.baseline.runId);
    const baselineMerged = mergeArchitectureCreatedHomeInput(props.baseline, snapshot);
    const clarificationData = clarificationQuestionsQuery.data;

    if (clarificationData === undefined) {
      return baselineMerged;
    }

    return {
      ...baselineMerged,
      findingsDerivedQuestions: clarificationData.questions,
      clarificationRoundAvailable: clarificationData.clarificationRoundAvailable,
      clarificationPriorRunId: props.baseline.clarificationPriorRunId ?? props.baseline.runId,
    };
  }, [props.baseline, clarificationQuestionsQuery.data]);

  const model = useMemo(() => buildArchitectureCreatedHomeModel(merged), [merged]);
  const userAssertions = useMemo(
    () => resolveUserAssertions(merged),
    [merged],
  );
  const openQuestionCount = useMemo(
    () => countOpenQuestionEntities(props.architectureSourceText, userAssertions),
    [props.architectureSourceText, userAssertions],
  );

  const activeTab = resolveArchitectureWorkspaceTabFromSearchParams(
    searchParams.get(REVIEW_DETAIL_TAB_PARAM),
    searchParams.get(ARCHITECTURE_WORKSPACE_TAB_PARAM),
  );
  const activeReviewTab = mapArchitectureTabToReviewTab(activeTab);
  const resolvedTabs = useMemo(
    () =>
      resolveReviewWorkspaceVisibleTabs({
        lifecycle: "create-home",
        manifestId: null,
        showProgressTracker: false,
        runCompleted: false,
      }),
    [],
  );

  const navigateReviewTab = useCallback(
    (tab: ReviewDetailTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(REVIEW_DETAIL_TAB_PARAM, tab);
      params.delete(ARCHITECTURE_WORKSPACE_TAB_PARAM);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const navigateTab = useCallback(
    (tab: ArchitectureWorkspaceTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(REVIEW_DETAIL_TAB_PARAM, mapArchitectureTabToReviewTab(tab));
      params.delete(ARCHITECTURE_WORKSPACE_TAB_PARAM);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const dismissClarificationGap = useCallback((itemId: string) => {
    setDismissedClarificationGapIds((current) => new Set([...current, itemId]));
  }, []);

  useEffect(() => {
    if (hashResolved) {
      return;
    }

    const hash = window.location.hash.slice(1);
    const tabFromHash = resolveArchitectureWorkspaceTabFromHash(hash);

    if (tabFromHash === null) {
      setHashResolved(true);

      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(REVIEW_DETAIL_TAB_PARAM, mapArchitectureTabToReviewTab(tabFromHash));
    params.delete(ARCHITECTURE_WORKSPACE_TAB_PARAM);
    router.replace(`${pathname}?${params.toString()}#${hash}`, { scroll: false });
    setHashResolved(true);
  }, [hashResolved, pathname, router, searchParams]);

  const findingsCount = props.findingsTriageVisibleCount ?? props.findings.length;
  const visibleClarificationGaps = model.clarificationGaps.filter(
    (item) => !dismissedClarificationGapIds.has(item.id),
  );
  const clarificationGapCount = countClarificationGaps(visibleClarificationGaps);
  const modelBackedInterviewQuestions = clarificationQuestionsQuery.data?.questions ?? [];
  const clarificationsCount =
    modelBackedInterviewQuestions.length > 0
      ? clarificationGapCount
      : countOpenClarifications(clarificationGapCount, openQuestionCount);
  const diagramClarifyHref = buildArchitectureCorrectionHref(props.baseline.runId, props.correctionHref);
  const compactViewportMode =
    activeTab === "clarifications" ||
    activeTab === "diagram" ||
    activeTab === "findings" ||
    activeTab === "governance" ||
    (buyerPolishedShell && activeTab === "overview")
      ? "context-bar"
      : "full";

  return (
    <div className="space-y-5" data-testid="architecture-created-workspace">
      {buyerPolishedShell && activeTab === "overview" ? (
        <a
          href={`#${ARCHITECTURE_CREATED_OVERVIEW_SKIP_TARGET_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {ARCHITECTURE_CREATED_OVERVIEW_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <ArchitectureCreatedWorkspaceHeader model={model} activeTab={activeTab} onNavigateTab={navigateTab} />

      <ArchitectureCreatedCompactFirstViewport
        model={model}
        runId={props.baseline.runId}
        architectureSourceText={props.architectureSourceText}
        userAssertions={userAssertions}
        canEditDiagram={props.canEditDiagram}
        onNavigateTab={navigateTab}
        mode={compactViewportMode}
        diagramClarifyHref={diagramClarifyHref}
        onUnconfirmedInferredCountChange={setDiagramInferredCount}
        pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
      />

      <ReviewWorkspaceTabStrip
        lifecycle="create-home"
        activeTab={activeReviewTab}
        resolvedTabs={resolvedTabs}
        tabCounts={{
          findings: findingsCount > 0 ? findingsCount : null,
          decisionsRemediation: clarificationsCount > 0 ? clarificationsCount : null,
          architecture: diagramInferredCount > 0 ? diagramInferredCount : null,
        }}
        onTabChange={navigateReviewTab}
      />

      <div
        hidden={activeTab !== "overview"}
        data-testid="architecture-workspace-panel-overview"
        id={buyerPolishedShell ? ARCHITECTURE_CREATED_OVERVIEW_PRIMARY_CONTENT_ID : undefined}
      >
          <div className="space-y-4">
            {buyerPolishedShell ? null : (
              <OverviewDiagramVocabularyRail
                runId={props.baseline.runId}
                currentSurfaceId="overview"
              />
            )}
            <ArchitectureCreatedOverviewPanel
              model={model}
              sourceText={props.architectureSourceText}
              userAssertions={userAssertions}
              correctionHref={props.correctionHref}
              openClarificationGapCount={clarificationGapCount}
              onNavigateTab={navigateTab}
              submittedArchitectureSection={props.panels.submittedArchitecture}
              pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
            />
            {buyerPolishedShell ? <ArchitectureCreatedOverviewBuyerChrome /> : null}
          </div>
      </div>

      <div hidden={activeTab !== "diagram"} data-testid="architecture-workspace-panel-diagram">
          <div className="space-y-4">
            <OverviewDiagramVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="diagram"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={showFindingsLinkedView}
                data-testid="architecture-findings-dual-pane-toggle"
                data-layout-mode={linkedLayoutMode}
                onClick={() => {
                  setShowFindingsLinkedView((current) => !current);
                }}
              >
                {showFindingsLinkedView
                  ? ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_OFF_LABEL
                  : ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_ON_LABEL}
              </Button>
            </div>
            {showFindingsLinkedView ? (
              <ArchitectureFindingsDualPane
                runId={props.baseline.runId}
                findings={props.findings}
                diagramNodes={diagramNodes}
                onHighlightedNodeIdChange={setHighlightedNodeId}
                diagram={
                  <ArchitectureDiagramPanel
                    runId={props.baseline.runId}
                    architectureName={merged.architectureName}
                    sourceText={props.architectureSourceText}
                    userAssertions={userAssertions}
                    canEdit={props.canEditDiagram}
                    clarifyHref={diagramClarifyHref}
                    onUnconfirmedInferredCountChange={setDiagramInferredCount}
                    onDiagramNodesChange={setDiagramNodes}
                    highlightedNodeId={highlightedNodeId}
                    variant="full"
                    pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
                  />
                }
              />
            ) : (
              <ArchitectureDiagramPanel
                runId={props.baseline.runId}
                architectureName={merged.architectureName}
                sourceText={props.architectureSourceText}
                userAssertions={userAssertions}
                canEdit={props.canEditDiagram}
                clarifyHref={diagramClarifyHref}
                onUnconfirmedInferredCountChange={setDiagramInferredCount}
                onDiagramNodesChange={setDiagramNodes}
                highlightedNodeId={null}
                variant="full"
                pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
              />
            )}
          </div>
      </div>

      <div hidden={activeTab !== "clarifications"} data-testid="architecture-workspace-panel-clarifications">
          <ClarificationsFindingsVocabularyRail
            runId={props.baseline.runId}
            currentSurfaceId="clarifications"
          />
          <ArchitectureCreatedClarificationsPanel
            model={model}
            sourceText={props.architectureSourceText}
            userAssertions={userAssertions}
            correctionHref={props.correctionHref}
            dismissedClarificationGapIds={dismissedClarificationGapIds}
            onDismissClarificationGap={dismissClarificationGap}
            onNavigateTab={navigateTab}
            pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
            clarificationQuestions={clarificationQuestionsQuery.data?.questions ?? []}
            clarificationRoundAvailable={clarificationQuestionsQuery.data?.clarificationRoundAvailable === true}
            clarificationDelta={clarificationQuestionsQuery.data?.deltaFromPriorRun ?? null}
            priorRunId={props.baseline.clarificationPriorRunId ?? props.baseline.runId}
          />
      </div>

      <div hidden={activeTab !== "findings"} data-testid="architecture-workspace-panel-findings">
          <div className="space-y-4">
            <ClarificationsFindingsVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="findings"
            />
            <ArchitectureCreatedFindingsNextAction
              runId={props.baseline.runId}
              findings={props.findings}
              analysisStagesComplete={props.analysisStagesComplete === true}
              onNavigateActivity={() => {
                navigateTab("activity");
              }}
              pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
            />
            {props.panels.findings}
          </div>
      </div>

      <div hidden={activeTab !== "evidence"} data-testid="architecture-workspace-panel-evidence">
          <div className="space-y-4">
            <PackageEvidenceEvidenceGraphVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-evidence"
            />
            {props.panels.evidence}
          </div>
      </div>

      <div hidden={activeTab !== "governance"} data-testid="architecture-workspace-panel-governance">
          <div className="space-y-4">
            <PackageGovernanceApprovalQueueVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-governance"
            />
            {props.panels.governance}
          </div>
      </div>

      <div hidden={activeTab !== "activity"} data-testid="architecture-workspace-panel-activity">
          <div className="space-y-4">
            <PackageActivityAuditTrailVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-activity"
            />
            {props.panels.activity}
          </div>
      </div>
    </div>
  );
}
