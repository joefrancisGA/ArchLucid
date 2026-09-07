"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { ActorDependentFindingsQuietEnginesHint } from "@/components/findings/ActorDependentFindingsQuietEnginesHint";
import { EngineInsightNoveltyRatesFootnote } from "@/components/findings/EngineInsightNoveltyRatesFootnote";
import { FindingsHiddenFilterHonestyBand } from "@/components/findings/FindingsHiddenFilterHonestyBand";
import { FindingsItsmExportToolbar } from "@/components/findings/FindingsItsmExportToolbar";
import type { WithheldFindingRow } from "@/lib/findings/findings-withheld-band";
import { FindingsWithheldBand } from "@/components/findings/FindingsWithheldBand";
import { FindingMergeConflictListCue } from "@/components/findings/FindingMergeConflictListCue";
import { RunDetailFindingsCardViewLazy } from "@/components/findings/RunDetailFindingsCardViewLazy";
import { RunDetailFindingsDenseTable } from "@/components/findings/RunDetailFindingsDenseTable";
import { RunDetailFindingsListViewToggle } from "@/components/findings/RunDetailFindingsListViewToggle";
import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";
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
import {
  useReviewFindingsLastVisitPersist,
  useReviewFindingsLastVisitRestore,
} from "@/hooks/use-review-findings-last-visit";
import { useReviewFindingsVisibilityState } from "@/hooks/use-review-findings-visibility-state";
import { isFindingMergeConflictReviewFinding } from "@/lib/review-quality/finding-quality-signals";
import { deriveFindingsHiddenFilterHonesty } from "@/lib/findings/findings-hidden-filter-honesty";
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
  defaultReviewFindingsListView,
  parseReviewFindingsListViewFromSearch,
} from "@/lib/findings/review-findings-list-view";
import {
  parseReviewFindingsClassificationBandFromSearch,
  reviewFindingsClassificationBandHrefFromSearch,
  REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM,
} from "@/lib/findings/review-findings-last-visit-url";
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
  readonly manifestIdForExportGuard?: string | null;
  readonly analysisStagesComplete?: boolean;
  readonly triageVisibleCount?: number;
  readonly graphSnapshot?: unknown;
  readonly requestAssumptionTexts?: readonly string[];
  readonly withheldFindings?: readonly WithheldFindingRow[];
  readonly onNavigateActivity?: () => void;
  readonly onNavigateClarifications?: () => void;
};

/** Findings list with workspace toolbar filters for the review detail page. */
export function RunDetailFindingsWorkspace(props: RunDetailFindingsWorkspaceProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "";
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
    setHideGenericLowDensity,
  } = useReviewFindingsVisibilityState();
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();

  useReviewFindingsLastVisitRestore({
    runId: props.runId,
    enabled: architectWorkspaceChrome,
  });

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

  const [classificationBand, setClassificationBandState] = useState<ReviewFindingsClassificationBandId>(() =>
    parseReviewFindingsClassificationBandFromSearch(searchParams?.get(REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM)),
  );

  const setClassificationBand = useCallback(
    (next: ReviewFindingsClassificationBandId): void => {
      setClassificationBandState(next);

      if (pathname.length === 0) {
        return;
      }

      router.replace(
        reviewFindingsClassificationBandHrefFromSearch(searchParams.toString(), pathname, next),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setClassificationBandState(
      parseReviewFindingsClassificationBandFromSearch(searchParams?.get(REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM)),
    );
  }, [searchParams]);

  const listView =
    parseReviewFindingsListViewFromSearch(searchParams?.get("findingsListView")) ??
    defaultReviewFindingsListView(architectWorkspaceChrome);
  const useDenseTable = listView === "table" && architectWorkspaceChrome;

  useReviewFindingsLastVisitPersist({
    runId: props.runId,
    enabled: architectWorkspaceChrome,
    filter: toolbar.filter,
    jobView: toolbar.jobView,
    searchQuery: toolbar.searchQuery,
    ownerFilter: toolbar.ownerFilter,
    domainFilter: toolbar.domainFilter,
    originFilter: toolbar.originFilter,
    groundingFilter: toolbar.groundingFilter,
    sort: toolbar.sort,
    classificationBand,
    hideGenericLowDensity,
  });

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
  const visibleFindingIds = useMemo(() => new Set(listFindings.map((row) => row.findingId)), [listFindings]);
  const hiddenByFilterFindings = useMemo(
    () => toolbarScopedFindings.filter((row) => !visibleFindingIds.has(row.findingId)),
    [toolbarScopedFindings, visibleFindingIds],
  );
  const hiddenFilterHonesty = useMemo(
    () =>
      deriveFindingsHiddenFilterHonesty({
        toolbarFilteredCount: toolbarScopedFindings.length,
        visibleCount: listFindings.length,
        hiddenFindings: hiddenByFilterFindings,
      }),
    [hiddenByFilterFindings, listFindings.length, toolbarScopedFindings.length],
  );
  const showAllFilteredFindings = () => {
    toolbar.setFilter("all");
    toolbar.setSearchQuery("");
    toolbar.clearOwnerFilter();
    toolbar.clearDomainFilter();
    toolbar.setOriginFilter("all");
    toolbar.setGroundingFilter("all");
    setClassificationBand("all");
    setShowLowConfidence(true);
    setShowAdvisory(true);
    setHideGenericLowDensity(false);
  };
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
  const findingsListProps = {
    runId: props.runId,
    findings: listFindings,
    sourceFindingsCount: props.findings.length,
    buyerPolishedShell: props.buyerPolishedShell,
    headlineFindingCount: props.headlineFindingCount,
    headlineWarningCount: props.headlineWarningCount,
    usingExplanationFallback: props.usingExplanationFallback,
    manifestRuleSetId: props.manifestRuleSetId,
    manifestRuleSetVersion: props.manifestRuleSetVersion,
    defaultExpandLowSeverity: false,
    providerNeutralWorkItems: props.providerNeutralWorkItems,
    architectureWorkItemContext: props.architectureWorkItemContext,
    packageCommitted: props.packageCommitted,
    analysisStagesComplete: props.analysisStagesComplete,
    onNavigateActivity: props.onNavigateActivity,
    onNavigateClarifications: props.onNavigateClarifications,
    confidenceVisibility: {
      showLowConfidence,
      onShowLowConfidenceChange: setShowLowConfidence,
      hiddenByConfidenceCount,
      managedExternally: true as const,
    },
    advisoryVisibility: {
      showAdvisory,
      onShowAdvisoryChange: setShowAdvisory,
      managedExternally: true as const,
    },
  };
  const findingsListEl = useDenseTable ? (
    <RunDetailFindingsDenseTable
      runId={props.runId}
      findings={listFindings}
      showDensityScore={architectWorkspaceChrome}
    />
  ) : (
    <RunDetailFindingsCardViewLazy {...findingsListProps} />
  );
  const toolbarEl = (
    <div className="space-y-3" data-testid="run-detail-findings-toolbar-hero">
      {architectWorkspaceChrome && showActorEnginesQuietHint ? (
        <ActorDependentFindingsQuietEnginesHint show={true} runId={props.runId} />
      ) : null}
      {architectWorkspaceChrome ? (
        <RunDetailFindingsListViewToggle workingMode={architectWorkspaceChrome} />
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
          manifestVersionForExportGuard={props.manifestIdForExportGuard}
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
      <FindingsWithheldBand runId={props.runId} withheld={props.withheldFindings ?? []} />
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
      {hiddenFilterHonesty.hasHidden ? (
        <FindingsHiddenFilterHonestyBand honesty={hiddenFilterHonesty} onShowAll={showAllFilteredFindings} />
      ) : null}
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
          <EngineInsightNoveltyRatesFootnote />
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
          {findingsListEl}
          {toolbarEl}
        </>
      ) : (
        <>
          {toolbarEl}
          {findingsListEl}
        </>
      )}
    </div>
    </FindingKeyboardTriageHost>
  );
}
