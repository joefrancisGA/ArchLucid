"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { ActorDependentFindingsQuietEnginesHint } from "@/components/findings/ActorDependentFindingsQuietEnginesHint";
import { FindingsItsmExportToolbar } from "@/components/findings/FindingsItsmExportToolbar";
import { FindingMergeConflictListCue } from "@/components/findings/FindingMergeConflictListCue";
import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
import { ReviewAssumptionConfirmationStrip } from "@/components/findings/ReviewAssumptionConfirmationStrip";
import { RootCauseClusterDispositionStrip } from "@/components/findings/RootCauseClusterDispositionStrip";
import {
  RunDetailFindingsToolbar,
  filterFindingsForToolbar,
  sortFindingsForToolbar,
  useRunDetailFindingsToolbarState,
  type RunDetailFindingsFilterKind,
} from "@/components/findings/RunDetailFindingsToolbar";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import { applyFindingsConfidenceVisibility } from "@/lib/findings/finding-confidence-filter";
import {
  architectureAssessmentFindingsPresentation,
  reviewFindingsGovernanceQueuePresentation,
} from "@/lib/metric-count-presentation";
import { ReviewPackageGovernanceFindingsVocabularyRail } from "@/components/ReviewPackageGovernanceFindingsVocabularyRail";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { SimulatorModeAiOperationNotice } from "@/components/usability/SimulatorModeAiOperationNotice";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { useReviewFindingsVisibilityState } from "@/hooks/use-review-findings-visibility-state";
import { isFindingMergeConflictReviewFinding } from "@/lib/review-quality/finding-quality-signals";
import {
  filterReviewDetailFindingsHideGeneric,
  sortReviewDetailFindingsBySignal,
} from "@/lib/findings/review-detail-findings-density-sort";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";
import {
  countFindingsByClassificationBand,
  filterFindingsByClassificationBand,
  type ReviewFindingsClassificationBandId,
} from "@/lib/findings/review-detail-findings-classification-band";
import { COMMAND_PALETTE_FINDING_CHECKLIST_BAND_EVENT } from "@/lib/command-palette-handler-actions";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import {
  deriveRunDetailFindingsTriageCounts,
  formatFindingsExcludedSummaryLine,
} from "@/lib/runs/run-detail-findings-triage-counts";
import {
  resolveFindingJobViewFromSearchParam,
  REVIEW_FINDINGS_JOB_VIEW_PARAM,
} from "@/lib/findings/review-findings-job-view-url";
import { buildWorkspaceCardRenderedFindings } from "@/lib/quick-decision-finding-merge-and-sort";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailFindingsWorkspaceProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly buyerPolishedShell?: boolean;
  readonly headlineFindingCount?: number | null;
  readonly headlineWarningCount?: number | null;
  readonly usingExplanationFallback?: boolean;
  readonly manifestRuleSetId?: string | null;
  readonly manifestRuleSetVersion?: string | null;
  readonly providerNeutralWorkItems?: boolean;
  readonly architectureWorkItemContext?: {
    readonly architectureName: string;
    readonly architectureOverview: string;
    readonly ownerLabel: string | null;
  } | null;
  readonly packageCommitted?: boolean;
  readonly analysisStagesComplete?: boolean;
  readonly triageVisibleCount?: number;
  readonly graphSnapshot?: unknown;
  readonly requestAssumptionTexts?: readonly string[];
  readonly onNavigateActivity?: () => void;
  readonly onNavigateClarifications?: () => void;
};

/** Findings list with workspace toolbar filters for the review detail page. */
export function RunDetailFindingsWorkspace(props: RunDetailFindingsWorkspaceProps): ReactElement {
  const searchParams = useSearchParams();
  const initialJobView = resolveFindingJobViewFromSearchParam(
    searchParams?.get(REVIEW_FINDINGS_JOB_VIEW_PARAM),
  );
  const toolbar = useRunDetailFindingsToolbarState({ initialJobView });
  const {
    showLowConfidence,
    showAdvisory,
    hideGenericLowDensity,
    setShowLowConfidence,
    setShowAdvisory,
  } = useReviewFindingsVisibilityState();

  function applyNaturalLanguageFacets(facets: FindingsNaturalLanguageFacets): void {

    if (facets.severity !== null) {
      toolbar.setFilter(facets.severity as RunDetailFindingsFilterKind);
    } else if (facets.status === "open") {
      toolbar.setFilter("unresolved");
    } else if (facets.status === "disposed") {
      toolbar.setFilter("resolved");
    }

    toolbar.setSearchQuery(facets.titleKeywords.join(" "));
  }
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const [classificationBand, setClassificationBand] = useState<ReviewFindingsClassificationBandId>("decision-grade");

  useEffect(() => {
    const onChecklistBand = () => {
      setClassificationBand("checklist");
    };

    window.addEventListener(COMMAND_PALETTE_FINDING_CHECKLIST_BAND_EVENT, onChecklistBand);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_FINDING_CHECKLIST_BAND_EVENT, onChecklistBand);
    };
  }, []);

  const createHomeSurface = props.packageCommitted === false;
  const actorNodeCount = countActorNodesInGraphSnapshot(props.graphSnapshot);
  const showActorEnginesQuietHint =
    props.analysisStagesComplete === true && actorNodeCount === 0;
  const triageCounts = deriveRunDetailFindingsTriageCounts(props.findings);
  const triageVisibleCount = props.triageVisibleCount ?? triageCounts.triageVisibleCount;
  const excludedSummaryLine = formatFindingsExcludedSummaryLine(triageCounts);
  const toolbarScopedFindings = filterFindingsForToolbar(
    props.findings,
    toolbar.filter,
    toolbar.ownerFilter,
    toolbar.domainFilter,
    toolbar.searchQuery,
    toolbar.jobView,
    toolbar.originFilter,
    toolbar.groundingFilter,
  );
  const { visibleFindings: confidenceVisibleScoped, hiddenByConfidenceCount } = applyFindingsConfidenceVisibility(
    toolbarScopedFindings,
    showLowConfidence,
  );
  const densityFilteredFindings =
    architectWorkspaceChrome && hideGenericLowDensity
      ? filterReviewDetailFindingsHideGeneric(confidenceVisibleScoped, true)
      : confidenceVisibleScoped;
  const bandScopedFindings =
    architectWorkspaceChrome
      ? filterFindingsByClassificationBand(densityFilteredFindings, classificationBand)
      : densityFilteredFindings;
  const classificationCounts = countFindingsByClassificationBand(confidenceVisibleScoped);
  const listFindings = architectWorkspaceChrome
    ? sortReviewDetailFindingsBySignal(bandScopedFindings)
    : sortFindingsForToolbar(confidenceVisibleScoped, toolbar.sort);
  const { visibleFindings: confidenceGatedForCounts } = applyFindingsConfidenceVisibility(
    filterFindingsForToolbar(
      props.findings,
      "all",
      toolbar.ownerFilter,
      toolbar.domainFilter,
      toolbar.searchQuery,
      toolbar.jobView,
      toolbar.originFilter,
      toolbar.groundingFilter,
    ),
    showLowConfidence,
  );
  const exportFindings = buildWorkspaceCardRenderedFindings(listFindings, {
    showAdvisory,
    showMuted: false,
  });
  const firstListedFinding = listFindings[0];
  const findingsSecondaryViewPresentation =
    !createHomeSurface && firstListedFinding !== undefined
      ? buildCanonicalObjectSecondaryView("finding", "reviewPackageFindingsTab", {
          runId: props.runId,
          findingId: firstListedFinding.findingId,
        })
      : null;
  const metricPresentation = createHomeSurface
    ? architectureAssessmentFindingsPresentation(props.runId, triageVisibleCount)
    : reviewFindingsGovernanceQueuePresentation(props.runId, triageVisibleCount);

  const metricCountEl = (
    <div className="mb-3" data-testid="run-detail-findings-metric-count">
      <SelfDescribingMetricCount
        presentation={metricPresentation}
        testId={
          createHomeSurface
            ? "run-detail-findings-assessment-metric"
            : "run-detail-findings-governance-metric"
        }
      />
    </div>
  );
  const findingsSummaryEl = (
    <QuickDecisionSummary
      runId={props.runId}
      findings={listFindings}
      sourceFindingsCount={props.findings.length}
      buyerPolishedShell={props.buyerPolishedShell}
      headlineFindingCount={props.headlineFindingCount}
      headlineWarningCount={props.headlineWarningCount}
      usingExplanationFallback={props.usingExplanationFallback}
      manifestRuleSetId={props.manifestRuleSetId}
      manifestRuleSetVersion={props.manifestRuleSetVersion}
      workspaceCardMode
      defaultExpandLowSeverity={false}
      providerNeutralWorkItems={props.providerNeutralWorkItems}
      architectureWorkItemContext={props.architectureWorkItemContext}
      packageCommitted={props.packageCommitted}
      analysisStagesComplete={props.analysisStagesComplete}
      onNavigateActivity={props.onNavigateActivity}
      onNavigateClarifications={props.onNavigateClarifications}
      confidenceVisibility={{
        showLowConfidence,
        onShowLowConfidenceChange: setShowLowConfidence,
        hiddenByConfidenceCount,
        managedExternally: true,
      }}
      advisoryVisibility={{
        showAdvisory,
        onShowAdvisoryChange: setShowAdvisory,
        managedExternally: true,
      }}
    />
  );
  const toolbarEl = (
    <div className="space-y-3" data-testid="run-detail-findings-toolbar-hero">
      {architectWorkspaceChrome && showActorEnginesQuietHint ? (
        <ActorDependentFindingsQuietEnginesHint show={true} runId={props.runId} />
      ) : null}
      <RunDetailFindingsToolbar
      findings={confidenceGatedForCounts}
      renderedFindingCount={listFindings.length}
      toolbarFilteredCount={toolbarScopedFindings.length}
      hiddenByConfidenceCount={hiddenByConfidenceCount}
      excludedSummaryLine={excludedSummaryLine}
      filter={toolbar.filter}
      onFilterChange={toolbar.setFilter}
      jobView={toolbar.jobView}
      onJobViewChange={toolbar.setJobView}
      ownerFilter={toolbar.ownerFilter}
      onOwnerFilterChange={toolbar.setOwnerFilter}
      onClearOwnerFilter={toolbar.clearOwnerFilter}
      domainFilter={toolbar.domainFilter}
      onDomainFilterChange={toolbar.setDomainFilter}
      onClearDomainFilter={toolbar.clearDomainFilter}
      searchQuery={toolbar.searchQuery}
      onSearchQueryChange={toolbar.setSearchQuery}
      sort={toolbar.sort}
      onSortChange={toolbar.setSort}
      originFilter={toolbar.originFilter}
      onOriginFilterChange={toolbar.setOriginFilter}
      groundingFilter={toolbar.groundingFilter}
      onGroundingFilterChange={toolbar.setGroundingFilter}
      layout={createHomeSurface ? "compact" : "full"}
      packageCommitted={props.packageCommitted}
      onNaturalLanguageFilterApply={applyNaturalLanguageFacets}
      exportSlot={
        <FindingsItsmExportToolbar
          runId={props.runId}
          findings={exportFindings}
          totalFindingCount={listFindings.length}
          compact
          packageCommitted={props.packageCommitted}
        />
      }
    />
    </div>
  );

  return (
    <FindingKeyboardTriageHost
      resolveRunId={(findingId) => (findingId.trim().length > 0 ? props.runId : null)}
      resolveDispositionBlockedReason={(findingId) => {
        const finding = props.findings.find((row) => row.findingId === findingId);

        if (finding !== undefined && isFindingMergeConflictReviewFinding(finding)) {
          return "Resolve the merge conflict on inspect before disposing from the list.";
        }

        return null;
      }}
    >
    <div className="space-y-4" data-testid="run-detail-findings-workspace">
      <SimulatorModeAiOperationNotice testId="run-detail-findings-simulator-notice" />
      <FindingMergeConflictListCue runId={props.runId} findings={props.findings} />
      {createHomeSurface ? <ArchitectureCreatedFindingsEvidenceOrientationStrip /> : null}
      {findingsSecondaryViewPresentation !== null ? (
        <CanonicalObjectSecondaryViewStrip
          presentation={findingsSecondaryViewPresentation}
          testId="review-findings-secondary-view-strip"
          className="mb-3"
        />
      ) : null}
      {!createHomeSurface ? (
        <ReviewPackageGovernanceFindingsVocabularyRail
          runId={props.runId}
          currentSurfaceId="review-package-findings"
        />
      ) : null}
      {metricCountEl}
      <ReviewAssumptionConfirmationStrip
        runId={props.runId}
        findings={props.findings}
        requestAssumptionTexts={props.requestAssumptionTexts}
      />
      {!createHomeSurface ? <RootCauseClusterDispositionStrip findings={props.findings} /> : null}
      {architectWorkspaceChrome ? (
        <div className="space-y-2" data-testid="run-detail-findings-density-desk-controls">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}
          </p>
          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Finding classification bands"
            data-testid="run-detail-findings-classification-bands"
          >
            {(
              [
                ["decision-grade", `Decision-grade (${classificationCounts.decisionGrade})`],
                ["checklist", `Checklist (${classificationCounts.checklist})`],
                ["all", `All (${confidenceVisibleScoped.length})`],
              ] as const
            ).map(([bandId, label]) => (
              <button
                key={bandId}
                type="button"
                role="tab"
                aria-selected={classificationBand === bandId}
                className={cn(
                  "rounded-md border px-2 py-1 text-sm",
                  classificationBand === bandId
                    ? "border-neutral-500 bg-neutral-100 dark:bg-neutral-800"
                    : "border-neutral-200 dark:border-neutral-700",
                )}
                onClick={() => {
                  setClassificationBand(bandId);
                }}
                data-testid={`run-detail-findings-band-${bandId}`}
              >
                {label}
              </button>
            ))}
          </div>
          {classificationBand === "decision-grade" && classificationCounts.checklist > 0 && listFindings.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="run-detail-findings-checklist-remains-hint">
              {classificationCounts.checklist} checklist {classificationCounts.checklist === 1 ? "row remains" : "rows remain"} on this package — open the Checklist band to triage them.
            </p>
          ) : null}
        </div>
      ) : null}
      {createHomeSurface ? (
        <>
          {findingsSummaryEl}
          {toolbarEl}
        </>
      ) : (
        <>
          {toolbarEl}
          {findingsSummaryEl}
        </>
      )}
    </div>
    </FindingKeyboardTriageHost>
  );
}
