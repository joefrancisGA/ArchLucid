"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { ArchitectureCreatedFindingsNextAction } from "@/components/architecture/ArchitectureCreatedFindingsNextAction";
import { FindingsItsmExportToolbar } from "@/components/findings/FindingsItsmExportToolbar";
import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
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
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import {
  buildWorkspaceCardRenderedFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import {
  deriveRunDetailFindingsTriageCounts,
  formatFindingsExcludedSummaryLine,
} from "@/lib/runs/run-detail-findings-triage-counts";

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
  readonly onNavigateActivity?: () => void;
  readonly onNavigateClarifications?: () => void;
};

/** Findings list with workspace toolbar filters for the review detail page. */
export function RunDetailFindingsWorkspace(props: RunDetailFindingsWorkspaceProps): ReactElement {
  const toolbar = useRunDetailFindingsToolbarState();

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
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const createHomeSurface = props.packageCommitted === false;
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
  );
  const { visibleFindings: confidenceVisibleScoped, hiddenByConfidenceCount } = applyFindingsConfidenceVisibility(
    toolbarScopedFindings,
    showLowConfidence,
  );
  const listFindings = sortFindingsForToolbar(confidenceVisibleScoped, toolbar.sort);
  const { visibleFindings: confidenceGatedForCounts } = applyFindingsConfidenceVisibility(
    filterFindingsForToolbar(
      props.findings,
      "all",
      toolbar.ownerFilter,
      toolbar.domainFilter,
      toolbar.searchQuery,
      toolbar.jobView,
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
      domainFilter={toolbar.domainFilter}
      onDomainFilterChange={toolbar.setDomainFilter}
      searchQuery={toolbar.searchQuery}
      onSearchQueryChange={toolbar.setSearchQuery}
      sort={toolbar.sort}
      onSortChange={toolbar.setSort}
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
  );

  return (
    <div className="space-y-4" data-testid="run-detail-findings-workspace">
      <FindingKeyboardTriageHost resolveRunId={(findingId) => (findingId.trim().length > 0 ? props.runId : null)} />
      {createHomeSurface ? <ArchitectureCreatedFindingsEvidenceOrientationStrip /> : null}
      {createHomeSurface ? (
        <ArchitectureCreatedFindingsNextAction
          runId={props.runId}
          findings={props.findings}
          analysisStagesComplete={props.analysisStagesComplete === true}
          onNavigateActivity={props.onNavigateActivity}
        />
      ) : null}
      {findingsSecondaryViewPresentation !== null ? (
        <CanonicalObjectSecondaryViewStrip
          presentation={findingsSecondaryViewPresentation}
          testId="review-findings-secondary-view-strip"
          className="mb-3"
        />
      ) : null}
      {metricCountEl}
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
