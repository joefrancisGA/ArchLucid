"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureCreatedClarificationsPanel } from "@/components/architecture/ArchitectureCreatedClarificationsPanel";
import { ArchitectureCreatedCompactFirstViewport } from "@/components/architecture/ArchitectureCreatedCompactFirstViewport";
import { ArchitectureCreatedOverviewPanel } from "@/components/architecture/ArchitectureCreatedOverviewPanel";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ARCHITECTURE_WORKSPACE_TAB_LABELS,
  ARCHITECTURE_WORKSPACE_TAB_PARAM,
  type ArchitectureWorkspaceTabId,
  resolveArchitectureWorkspaceTabFromHash,
  resolveArchitectureWorkspaceTab,
  resolveArchitectureWorkspaceTabFromSearchParams,
} from "@/lib/architecture/architecture-workspace-tabs";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import { REVIEW_WORKSPACE_TAB_STRIP_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";
import { mapArchitectureTabToReviewTab } from "@/lib/unified-review-workspace-tabs";
import {
  architectureOpenClarificationsPresentation,
  formatMetricCountHeadline,
} from "@/lib/metric-count-presentation";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);
  const [dismissedClarificationGapIds, setDismissedClarificationGapIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [diagramInferredCount, setDiagramInferredCount] = useState(0);
  const [showFindingsLinkedView, setShowFindingsLinkedView] = useState(false);
  const [diagramNodes, setDiagramNodes] = useState<readonly { id: string; label: string }[]>([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const linkedLayoutMode = resolveArchitectureFindingsDualPaneLayoutMode(showFindingsLinkedView);

  const merged = useMemo(() => {
    const snapshot = readArchitectureCreationHandoff(props.baseline.runId);

    return mergeArchitectureCreatedHomeInput(props.baseline, snapshot);
  }, [props.baseline]);

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
  const clarificationsCount = countOpenClarifications(clarificationGapCount, openQuestionCount);
  const clarificationsPresentation = architectureOpenClarificationsPresentation(
    props.baseline.runId,
    clarificationsCount,
  );
  const clarificationsTabAriaLabel = formatMetricCountHeadline(clarificationsPresentation);
  const diagramClarifyHref = buildArchitectureCorrectionHref(props.baseline.runId, props.correctionHref);
  const compactViewportMode =
    activeTab === "clarifications" ||
    activeTab === "diagram" ||
    activeTab === "findings" ||
    activeTab === "governance"
      ? "context-bar"
      : "full";

  return (
    <div className="space-y-5" data-testid="architecture-created-workspace" data-workspace-lifecycle="create-home">
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
      />

      <Tabs value={activeTab} onValueChange={(value) => navigateTab(resolveArchitectureWorkspaceTab(value))}>
        <div
          className="-mx-1 overflow-x-auto px-1"
          data-testid={REVIEW_WORKSPACE_TAB_STRIP_TEST_ID}
        >
          <TabsList aria-label="Architecture workspace sections" data-testid="architecture-workspace-tabs">
            {(Object.keys(ARCHITECTURE_WORKSPACE_TAB_LABELS) as ArchitectureWorkspaceTabId[]).map((tabId) => {
              const count =
                tabId === "clarifications" && clarificationsCount > 0
                  ? clarificationsCount
                  : tabId === "diagram" && diagramInferredCount > 0
                    ? diagramInferredCount
                    : tabId === "findings" && findingsCount > 0
                      ? findingsCount
                      : null;
              const findingsTabAriaLabel =
                tabId === "findings" && findingsCount > 0
                  ? `${findingsCount} assessment finding${findingsCount === 1 ? "" : "s"} · this review · findings tab`
                  : undefined;

              return (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  data-testid={`architecture-workspace-tab-${tabId}`}
                  className="whitespace-nowrap"
                >
                  {ARCHITECTURE_WORKSPACE_TAB_LABELS[tabId]}
                  {count !== null ? (
                    <span
                      className={cn(
                        "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                      aria-label={tabId === "clarifications" ? clarificationsTabAriaLabel : findingsTabAriaLabel}
                      data-testid={
                        tabId === "clarifications"
                          ? "architecture-workspace-clarifications-count"
                          : tabId === "diagram"
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
        </div>

        <TabsContent value="overview" data-testid="architecture-workspace-panel-overview">
          <div className="space-y-4">
            <OverviewDiagramVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="overview"
            />
            <ArchitectureCreatedOverviewPanel
              model={model}
              sourceText={props.architectureSourceText}
              userAssertions={userAssertions}
              correctionHref={props.correctionHref}
              openClarificationGapCount={clarificationGapCount}
              onNavigateTab={navigateTab}
              submittedArchitectureSection={props.panels.submittedArchitecture}
            />
          </div>
        </TabsContent>

        <TabsContent value="diagram" data-testid="architecture-workspace-panel-diagram">
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
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="clarifications" data-testid="architecture-workspace-panel-clarifications">
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
          />
        </TabsContent>

        <TabsContent value="findings" data-testid="architecture-workspace-panel-findings">
          <div className="space-y-4">
            <ClarificationsFindingsVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="findings"
            />
            {props.panels.findings}
          </div>
        </TabsContent>

        <TabsContent value="evidence" data-testid="architecture-workspace-panel-evidence">
          <div className="space-y-4">
            <PackageEvidenceEvidenceGraphVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-evidence"
            />
            {props.panels.evidence}
          </div>
        </TabsContent>

        <TabsContent value="governance" data-testid="architecture-workspace-panel-governance">
          <div className="space-y-4">
            <PackageGovernanceApprovalQueueVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-governance"
            />
            {props.panels.governance}
          </div>
        </TabsContent>

        <TabsContent value="activity" data-testid="architecture-workspace-panel-activity">
          <div className="space-y-4">
            <PackageActivityAuditTrailVocabularyRail
              runId={props.baseline.runId}
              currentSurfaceId="package-activity"
            />
            {props.panels.activity}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
