"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import {
  filterReviewDetailFindingsHideGeneric,
  INSIGHT_DENSITY_GENERIC_THRESHOLD,
  sortReviewDetailFindingsBySignal,
} from "@/lib/findings/review-detail-findings-density-sort";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import {
  deriveRunDetailFindingsTriageCounts,
  formatFindingsExcludedSummaryLine,
} from "@/lib/runs/run-detail-findings-triage-counts";
import {
  resolveFindingJobViewFromSearchParam,
  REVIEW_FINDINGS_JOB_VIEW_PARAM,
} from "@/lib/findings/review-findings-job-view-url";
import {
  parseReviewFindingsHideGenericFromSearch,
  parseReviewFindingsShowAdvisoryFromSearch,
  parseReviewFindingsShowLowFromSearch,
  reviewFindingsVisibilityHrefFromSearch,
} from "@/lib/findings/review-findings-visibility-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlShowLow = parseReviewFindingsShowLowFromSearch(searchParams?.get("showLow"));
  const urlShowAdvisory = parseReviewFindingsShowAdvisoryFromSearch(searchParams?.get("showAdvisory"));
  const urlHideGeneric = parseReviewFindingsHideGenericFromSearch(searchParams?.get("hideGeneric"));
  const initialJobView = resolveFindingJobViewFromSearchParam(
    searchParams?.get(REVIEW_FINDINGS_JOB_VIEW_PARAM),
  );
  const toolbar = useRunDetailFindingsToolbarState({ initialJobView });

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
  const [showLowConfidence, setShowLowConfidenceState] = useState(urlShowLow);
  const [showAdvisory, setShowAdvisoryState] = useState(urlShowAdvisory);
  const [hideGenericLowDensity, setHideGenericLowDensityState] = useState(urlHideGeneric);

  useEffect(() => {
    setShowLowConfidenceState(urlShowLow);
  }, [urlShowLow]);

  useEffect(() => {
    setShowAdvisoryState(urlShowAdvisory);
  }, [urlShowAdvisory]);

  useEffect(() => {
    setHideGenericLowDensityState(urlHideGeneric);
  }, [urlHideGeneric]);

  const syncVisibilityToUrl = useCallback(
    (next: { showLowConfidence: boolean; showAdvisory: boolean; hideGenericLowDensity: boolean }) => {
      if (pathname.length === 0) {
        return;
      }

      const nextHref = reviewFindingsVisibilityHrefFromSearch(searchParams.toString(), next, pathname);
      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setShowLowConfidence = useCallback(
    (next: boolean) => {
      setShowLowConfidenceState(next);
      syncVisibilityToUrl({
        showLowConfidence: next,
        showAdvisory,
        hideGenericLowDensity,
      });
    },
    [hideGenericLowDensity, showAdvisory, syncVisibilityToUrl],
  );

  const setShowAdvisory = useCallback(
    (next: boolean) => {
      setShowAdvisoryState(next);
      syncVisibilityToUrl({
        showLowConfidence,
        showAdvisory: next,
        hideGenericLowDensity,
      });
    },
    [hideGenericLowDensity, showLowConfidence, syncVisibilityToUrl],
  );

  const setHideGenericLowDensity = useCallback(
    (next: boolean) => {
      setHideGenericLowDensityState(next);
      syncVisibilityToUrl({
        showLowConfidence,
        showAdvisory,
        hideGenericLowDensity: next,
      });
    },
    [showAdvisory, showLowConfidence, syncVisibilityToUrl],
  );
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
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
  const listFindings = architectWorkspaceChrome
    ? sortReviewDetailFindingsBySignal(densityFilteredFindings)
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
    <div className="space-y-4" data-testid="run-detail-findings-workspace">
      <SimulatorModeAiOperationNotice testId="run-detail-findings-simulator-notice" />
      <FindingKeyboardTriageHost resolveRunId={(findingId) => (findingId.trim().length > 0 ? props.runId : null)} />
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
          <label
            className={cn(
              "flex items-center gap-2 text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="run-detail-findings-hide-generic-control"
          >
            <input
              type="checkbox"
              checked={hideGenericLowDensity}
              onChange={(event) => {
                setHideGenericLowDensity(event.target.checked);
              }}
            />
            Hide generic findings (density score below {INSIGHT_DENSITY_GENERIC_THRESHOLD}) — advisory only
          </label>
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
  );
}
