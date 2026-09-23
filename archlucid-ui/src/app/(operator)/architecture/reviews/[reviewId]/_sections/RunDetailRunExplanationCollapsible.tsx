"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
  type FindingsSnapshotInsightDensityView,
} from "@/lib/findings/findings-snapshot-insight-density";
import { hasFindingsWhatIfAnalysisContent } from "@/lib/findings/findings-what-if-analysis";
import type { WithheldFindingRow } from "@/lib/findings/findings-withheld-band";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { RunDecisionExplainabilitySection } from "@/components/runs/RunDecisionExplainabilitySection";
import type { RunDecisionExplainabilityModel } from "@/lib/runs/run-decision-explainability-from-detail";
import { cn } from "@/lib/utils";
import {
  parseRunAssessmentNarrativeOpenFromSearch,
  runAssessmentNarrativeHrefFromSearch,
} from "@/lib/reviews/run-assessment-narrative-url";
import {
  parseRunCoverageCurationOpenFromSearch,
  runCoverageCurationDisclosureHrefFromSearch,
} from "@/lib/reviews/run-coverage-curation-disclosure-url";
import {
  parseRunFindingExplainabilityOpenFromSearch,
  runFindingExplainabilityDisclosureHrefFromSearch,
} from "@/lib/reviews/run-finding-explainability-disclosure-url";
import {
  parseRunImpactAnalysisOpenFromSearch,
  runImpactAnalysisDisclosureHrefFromSearch,
} from "@/lib/reviews/run-impact-analysis-disclosure-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { REVIEW_DETAIL_URL_CHANGED_EVENT } from "@/lib/review-detail-workspace-tabs";

import { RunDetailSponsorModeExplanationCard } from "./RunDetailSponsorModeExplanationCard";
import {
  FindingsWhatIfAnalysisPanelDeferred,
  RunDetailFindingsWorkspaceDeferred,
  RunExplanationSectionDeferred,
  RunFindingExplainabilityTableDeferred,
} from "./run-detail-explanation-collapsible-deferred-chunks";

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
  } = props;
  const pathname = usePathname() ?? "/";
  const [assessmentNarrativeOpen, setAssessmentNarrativeOpenState] = useState(() =>
    parseRunAssessmentNarrativeOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runAssessmentNarrativeOpen"),
    ),
  );
  const [coverageCurationOpen, setCoverageCurationOpenState] = useState(() =>
    parseRunCoverageCurationOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runCoverageCurationOpen"),
    ),
  );
  const [impactAnalysisOpen, setImpactAnalysisOpenState] = useState(() =>
    parseRunImpactAnalysisOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runImpactAnalysisOpen"),
    ),
  );
  const [findingExplainabilityOpen, setFindingExplainabilityOpenState] = useState(() =>
    parseRunFindingExplainabilityOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runFindingExplainabilityOpen"),
    ),
  );
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
      if (assessmentNarrativeOpen === open) {
        return;
      }

      setAssessmentNarrativeOpenState(open);
      syncAssessmentNarrativeOpenToUrl(open);
    },
    [assessmentNarrativeOpen, syncAssessmentNarrativeOpenToUrl],
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
      if (coverageCurationOpen === open) {
        return;
      }

      setCoverageCurationOpenState(open);
      syncCoverageCurationOpenToUrl(open);
    },
    [coverageCurationOpen, syncCoverageCurationOpenToUrl],
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
      if (impactAnalysisOpen === open) {
        return;
      }

      setImpactAnalysisOpenState(open);
      syncImpactAnalysisOpenToUrl(open);
    },
    [impactAnalysisOpen, syncImpactAnalysisOpenToUrl],
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
      if (findingExplainabilityOpen === open) {
        return;
      }

      setFindingExplainabilityOpenState(open);
      syncFindingExplainabilityOpenToUrl(open);
    },
    [findingExplainabilityOpen, syncFindingExplainabilityOpenToUrl],
  );

  useEffect(() => {
    const syncDisclosuresFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);

      setAssessmentNarrativeOpenState((current) => {
        const next = parseRunAssessmentNarrativeOpenFromSearch(params.get("runAssessmentNarrativeOpen"));

        return current === next ? current : next;
      });
      setCoverageCurationOpenState((current) => {
        const next = parseRunCoverageCurationOpenFromSearch(params.get("runCoverageCurationOpen"));

        return current === next ? current : next;
      });
      setImpactAnalysisOpenState((current) => {
        const next = parseRunImpactAnalysisOpenFromSearch(params.get("runImpactAnalysisOpen"));

        return current === next ? current : next;
      });
      setFindingExplainabilityOpenState((current) => {
        const next = parseRunFindingExplainabilityOpenFromSearch(params.get("runFindingExplainabilityOpen"));

        return current === next ? current : next;
      });
    };

    syncDisclosuresFromUrl();
    window.addEventListener("popstate", syncDisclosuresFromUrl);
    window.addEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncDisclosuresFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDisclosuresFromUrl);
      window.removeEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncDisclosuresFromUrl);
    };
  }, []);

  return (
    <section id="run-explanation" className="scroll-mt-24 space-y-4">
      <div className="space-y-4" data-testid="run-detail-findings-section">
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
