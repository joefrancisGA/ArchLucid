"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { explainRunBlockedReason } from "@/lib/explain/explain-run-blocked-reason";
import { CoverageChecklistPanel } from "@/components/usability/CoverageChecklistPanel";
import { InsightDensityCurationBanner } from "@/components/usability/InsightDensityCurationBanner";
import {
  hasFindingsSnapshotInsightDensityContent,
  type FindingsSnapshotInsightDensityView} from "@/lib/findings/findings-snapshot-insight-density";
import { hasFindingsWhatIfAnalysisContent } from "@/lib/findings/findings-what-if-analysis";
import type { WithheldFindingRow } from "@/lib/findings/findings-withheld-band";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { RunDecisionExplainabilitySection } from "@/components/runs/RunDecisionExplainabilitySection";
import type { RunDecisionExplainabilityModel } from "@/lib/runs/run-decision-explainability-from-detail";
import { cn } from "@/lib/utils";
import {
  RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM,
  parseRunAssessmentNarrativeOpenFromSearch,
  runAssessmentNarrativeHrefFromSearch,
} from "@/lib/reviews/run-assessment-narrative-url";
import {
  RUN_COVERAGE_CURATION_OPEN_PARAM,
  parseRunCoverageCurationOpenFromSearch,
  runCoverageCurationDisclosureHrefFromSearch,
} from "@/lib/reviews/run-coverage-curation-disclosure-url";
import {
  RUN_FINDING_EXPLAINABILITY_OPEN_PARAM,
  parseRunFindingExplainabilityOpenFromSearch,
  runFindingExplainabilityDisclosureHrefFromSearch,
} from "@/lib/reviews/run-finding-explainability-disclosure-url";
import {
  RUN_IMPACT_ANALYSIS_OPEN_PARAM,
  parseRunImpactAnalysisOpenFromSearch,
  runImpactAnalysisDisclosureHrefFromSearch,
} from "@/lib/reviews/run-impact-analysis-disclosure-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";

import { RUN_DETAIL_STATIC_DEMO_EXPLANATION_BANNER } from "@/lib/runs/run-detail-static-demo-explanation-copy";
import { RunDetailSponsorModeExplanationCard } from "./RunDetailSponsorModeExplanationCard";
import {
  FindingsWhatIfAnalysisPanelDeferred,
  RunDetailFindingsWorkspaceDeferred,
  RunExplanationSectionDeferred,
  RunFindingExplainabilityTableDeferred} from "./run-detail-explanation-collapsible-deferred-chunks";

type RunDetailRunExplanationCollapsibleProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly quickDecisionFindings: QuickDecisionFinding[];
  readonly quickDecisionFromExplanationFallback: boolean;
  readonly buyerSummaryOmitsAgentFindings?: boolean;
  readonly findingWireSnapshots: Record<string, FindingWireSnapshot>;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly explanationFailure: ApiLoadFailureState | null;
  readonly baselineAnnualCostUsd: number | null;
  readonly isIllustrativePricing?: boolean;
  readonly decisionExplainability: RunDecisionExplainabilityModel | null;
  readonly insightDensityView: FindingsSnapshotInsightDensityView;
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
  readonly withheldListLoadState?: string | null;
  readonly explanationUsesStaticDemo?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly parentArchitectureId?: string | null;
};

function buildFindingTitlesById(findings: readonly QuickDecisionFinding[]): Record<string, string> {
  return Object.fromEntries(findings.map((finding) => [finding.findingId, finding.title]));
}

export function RunDetailRunExplanationCollapsible(
  props: RunDetailRunExplanationCollapsibleProps,
): ReactElement | null {
  const {
    runId,
    buyerPolishedArtifactTable,
    quickDecisionFindings,
    quickDecisionFromExplanationFallback,
    buyerSummaryOmitsAgentFindings,
    findingWireSnapshots,
    findingCountDisplay,
    warningCountDisplay,
    explanationSummary,
    explanationFailure,
    baselineAnnualCostUsd,
    isIllustrativePricing,
    decisionExplainability,
    insightDensityView,
    manifestRuleSetId,
    manifestRuleSetVersion,
    providerNeutralWorkItems,
    architectureWorkItemContext,
    packageCommitted,
    analysisStagesComplete,
    triageVisibleCount,
    graphSnapshot,
    structuralExecutionMode,
    parentArchitectureId,
    explanationUsesStaticDemo = false} = props;
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlAssessmentNarrativeOpen = parseRunAssessmentNarrativeOpenFromSearch(
    searchParams.get(RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM),
  );
  const urlCoverageCurationOpen = parseRunCoverageCurationOpenFromSearch(
    searchParams.get(RUN_COVERAGE_CURATION_OPEN_PARAM),
  );
  const urlImpactAnalysisOpen = parseRunImpactAnalysisOpenFromSearch(
    searchParams.get(RUN_IMPACT_ANALYSIS_OPEN_PARAM),
  );
  const urlFindingExplainabilityOpen = parseRunFindingExplainabilityOpenFromSearch(
    searchParams.get(RUN_FINDING_EXPLAINABILITY_OPEN_PARAM),
  );
  const [assessmentNarrativeOpen, setAssessmentNarrativeOpenState] = useState(urlAssessmentNarrativeOpen);
  const assessmentNarrativeOpenRef = useRef(assessmentNarrativeOpen);
  assessmentNarrativeOpenRef.current = assessmentNarrativeOpen;
  const [coverageCurationOpen, setCoverageCurationOpenState] = useState(urlCoverageCurationOpen);
  const coverageCurationOpenRef = useRef(coverageCurationOpen);
  coverageCurationOpenRef.current = coverageCurationOpen;
  const [impactAnalysisOpen, setImpactAnalysisOpenState] = useState(urlImpactAnalysisOpen);
  const impactAnalysisOpenRef = useRef(impactAnalysisOpen);
  impactAnalysisOpenRef.current = impactAnalysisOpen;
  const [findingExplainabilityOpen, setFindingExplainabilityOpenState] = useState(urlFindingExplainabilityOpen);
  const findingExplainabilityOpenRef = useRef(findingExplainabilityOpen);
  findingExplainabilityOpenRef.current = findingExplainabilityOpen;
  const findingTitlesById = buildFindingTitlesById(quickDecisionFindings);
  const explanationBlockedReason = explainRunBlockedReason(explanationFailure);
  const showCoverageAndCuration = hasFindingsSnapshotInsightDensityContent(insightDensityView);
  const showImpactAnalysis = hasFindingsWhatIfAnalysisContent(
    quickDecisionFindings,
    baselineAnnualCostUsd,
  );

  const syncAssessmentNarrativeOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runAssessmentNarrativeHrefFromSearch(window.location.search.slice(1), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setAssessmentNarrativeOpen = useCallback(
    (open: boolean) => {
      if (assessmentNarrativeOpenRef.current === open) {
        return;
      }

      assessmentNarrativeOpenRef.current = open;
      setAssessmentNarrativeOpenState(open);
      syncAssessmentNarrativeOpenToUrl(open);
    },
    [syncAssessmentNarrativeOpenToUrl],
  );

  const syncCoverageCurationOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runCoverageCurationDisclosureHrefFromSearch(window.location.search.slice(1), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setCoverageCurationOpen = useCallback(
    (open: boolean) => {
      if (coverageCurationOpenRef.current === open) {
        return;
      }

      coverageCurationOpenRef.current = open;
      setCoverageCurationOpenState(open);
      syncCoverageCurationOpenToUrl(open);
    },
    [syncCoverageCurationOpenToUrl],
  );

  const syncImpactAnalysisOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runImpactAnalysisDisclosureHrefFromSearch(window.location.search.slice(1), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setImpactAnalysisOpen = useCallback(
    (open: boolean) => {
      if (impactAnalysisOpenRef.current === open) {
        return;
      }

      impactAnalysisOpenRef.current = open;
      setImpactAnalysisOpenState(open);
      syncImpactAnalysisOpenToUrl(open);
    },
    [syncImpactAnalysisOpenToUrl],
  );

  const syncFindingExplainabilityOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runFindingExplainabilityDisclosureHrefFromSearch(window.location.search.slice(1), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setFindingExplainabilityOpen = useCallback(
    (open: boolean) => {
      if (findingExplainabilityOpenRef.current === open) {
        return;
      }

      findingExplainabilityOpenRef.current = open;
      setFindingExplainabilityOpenState(open);
      syncFindingExplainabilityOpenToUrl(open);
    },
    [syncFindingExplainabilityOpenToUrl],
  );

  useEffect(() => {
    const syncDisclosuresFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);

      const nextAssessmentNarrativeOpen = parseRunAssessmentNarrativeOpenFromSearch(
        params.get(RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM),
      );

      if (assessmentNarrativeOpenRef.current !== nextAssessmentNarrativeOpen) {
        assessmentNarrativeOpenRef.current = nextAssessmentNarrativeOpen;
        setAssessmentNarrativeOpenState(nextAssessmentNarrativeOpen);
      }

      const nextCoverageCurationOpen = parseRunCoverageCurationOpenFromSearch(
        params.get(RUN_COVERAGE_CURATION_OPEN_PARAM),
      );

      if (coverageCurationOpenRef.current !== nextCoverageCurationOpen) {
        coverageCurationOpenRef.current = nextCoverageCurationOpen;
        setCoverageCurationOpenState(nextCoverageCurationOpen);
      }

      const nextImpactAnalysisOpen = parseRunImpactAnalysisOpenFromSearch(
        params.get(RUN_IMPACT_ANALYSIS_OPEN_PARAM),
      );

      if (impactAnalysisOpenRef.current !== nextImpactAnalysisOpen) {
        impactAnalysisOpenRef.current = nextImpactAnalysisOpen;
        setImpactAnalysisOpenState(nextImpactAnalysisOpen);
      }

      const nextFindingExplainabilityOpen = parseRunFindingExplainabilityOpenFromSearch(
        params.get(RUN_FINDING_EXPLAINABILITY_OPEN_PARAM),
      );

      if (findingExplainabilityOpenRef.current !== nextFindingExplainabilityOpen) {
        findingExplainabilityOpenRef.current = nextFindingExplainabilityOpen;
        setFindingExplainabilityOpenState(nextFindingExplainabilityOpen);
      }
    };

    syncDisclosuresFromUrl();
    window.addEventListener("popstate", syncDisclosuresFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDisclosuresFromUrl);
    };
  }, []);

  useEffect(() => {
    if (assessmentNarrativeOpenRef.current !== urlAssessmentNarrativeOpen) {
      assessmentNarrativeOpenRef.current = urlAssessmentNarrativeOpen;
      setAssessmentNarrativeOpenState(urlAssessmentNarrativeOpen);
    }

    if (coverageCurationOpenRef.current !== urlCoverageCurationOpen) {
      coverageCurationOpenRef.current = urlCoverageCurationOpen;
      setCoverageCurationOpenState(urlCoverageCurationOpen);
    }

    if (impactAnalysisOpenRef.current !== urlImpactAnalysisOpen) {
      impactAnalysisOpenRef.current = urlImpactAnalysisOpen;
      setImpactAnalysisOpenState(urlImpactAnalysisOpen);
    }

    if (findingExplainabilityOpenRef.current !== urlFindingExplainabilityOpen) {
      findingExplainabilityOpenRef.current = urlFindingExplainabilityOpen;
      setFindingExplainabilityOpenState(urlFindingExplainabilityOpen);
    }
  }, [
    urlAssessmentNarrativeOpen,
    urlCoverageCurationOpen,
    urlFindingExplainabilityOpen,
    urlImpactAnalysisOpen,
  ]);

  return (
    <section id="run-explanation" className="scroll-mt-24 space-y-4">
      <div className="space-y-4" data-testid="run-detail-findings-section">
        {explanationUsesStaticDemo ? (
          <p
            className={cn("m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="run-detail-static-demo-explanation-banner"
          >
            {RUN_DETAIL_STATIC_DEMO_EXPLANATION_BANNER}
          </p>
        ) : null}
        <RunDetailFindingsWorkspaceDeferred
          runId={runId}
          findings={quickDecisionFindings}
          buyerPolishedShell={buyerPolishedArtifactTable}
          headlineFindingCount={findingCountDisplay}
          headlineWarningCount={warningCountDisplay}
          usingExplanationFallback={quickDecisionFromExplanationFallback}
          buyerSummaryOmitsAgentFindings={buyerSummaryOmitsAgentFindings}
          manifestRuleSetId={manifestRuleSetId}
          manifestRuleSetVersion={manifestRuleSetVersion}
          providerNeutralWorkItems={providerNeutralWorkItems}
          architectureWorkItemContext={architectureWorkItemContext}
          packageCommitted={packageCommitted}
          manifestIdForExportGuard={props.manifestIdForExportGuard}
          analysisStagesComplete={analysisStagesComplete}
          triageVisibleCount={triageVisibleCount}
          graphSnapshot={graphSnapshot}
          requestAssumptionTexts={props.requestAssumptionTexts}
          withheldFindings={props.withheldFindings}
          withheldListLoadState={props.withheldListLoadState ?? null}
          structuralExecutionMode={structuralExecutionMode}
          parentArchitectureId={parentArchitectureId}
        />

        {showCoverageAndCuration ? (
          <details
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-workspace-disclosure
            data-testid="run-detail-coverage-curation-disclosure"
            open={coverageCurationOpen}
            onToggle={(event) => {
              setCoverageCurationOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.body)}>
              Finding coverage and curation
            </summary>
            <div className="mt-3 space-y-3">
              <InsightDensityCurationBanner curation={insightDensityView.curation} />
              <CoverageChecklistPanel items={insightDensityView.checklistCoverage} />
            </div>
          </details>
        ) : null}

        {showImpactAnalysis ? (
          <details
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-workspace-disclosure
            data-testid="run-detail-impact-analysis-disclosure"
            open={impactAnalysisOpen}
            onToggle={(event) => {
              setImpactAnalysisOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.body)}>
              Impact analysis
            </summary>
            <div className="mt-3">
              <FindingsWhatIfAnalysisPanelDeferred
                findings={quickDecisionFindings}
                baselineAnnualCostUsd={baselineAnnualCostUsd}
                isIllustrativePricing={isIllustrativePricing}
              />
            </div>
          </details>
        ) : null}
      </div>

      <CollapsibleSection
        title="Assessment narrative"
        open={assessmentNarrativeOpen}
        onToggle={setAssessmentNarrativeOpen}
        sectionTestId="run-detail-assessment-narrative"
      >
        <RunDetailSponsorModeExplanationCard
          explanationSummary={explanationSummary}
          findings={quickDecisionFindings}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
        {explanationFailure ? (
          <div className="space-y-2" data-testid="run-detail-explanation-blocked">
            <p className={cn("m-0 mb-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Aggregate explanation could not be loaded.
            </p>
            <OperatorApiProblem
              problem={explanationFailure.problem}
              fallbackMessage={explanationBlockedReason ?? explanationFailure.message}
              correlationId={explanationFailure.correlationId}
              variant="warning"
            />
            {explanationBlockedReason ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="run-detail-explanation-blocked-reason"
              >
                {explanationBlockedReason}
              </p>
            ) : (
              <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                The review and manifest loaded, but the explanation aggregate request failed (HTTP / transport / 404).
              </p>
            )}
            {explanationBlockedReason === null ? (
              <OperatorSectionRetryButton label="Retry loading explanation" />
            ) : null}
          </div>
        ) : null}
        {!explanationFailure ? (
          <>
            <RunExplanationSectionDeferred
              summary={explanationSummary}
              loading={false}
              error={null}
              runId={runId}
              displayFindingCount={findingCountDisplay}
              findingTitlesById={findingTitlesById}
            />
            {(() => {
              const traceRows =
                explanationSummary?.findingTraceConfidences ??
                explanationSummary?.explanation?.findingTraceConfidences ??
                [];

              if (traceRows.length === 0) {
                return null;
              }

              return (
                <CollapsibleSection
                  title="Per-finding trace details"
                  open={findingExplainabilityOpen}
                  onToggle={setFindingExplainabilityOpen}
                  sectionTestId="run-finding-explainability-collapsible"
                >
                  <RunFindingExplainabilityTableDeferred
                    runId={runId}
                    rows={traceRows}
                    findingWireSnapshots={findingWireSnapshots}
                  />
                </CollapsibleSection>
              );
            })()}
            {decisionExplainability !== null ? (
              <RunDecisionExplainabilitySection model={decisionExplainability} />
            ) : null}
          </>
        ) : null}
      </CollapsibleSection>
    </section>
  );
}
