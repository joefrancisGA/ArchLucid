import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CoverageChecklistPanel } from "@/components/usability/CoverageChecklistPanel";
import { InsightDensityCurationBanner } from "@/components/usability/InsightDensityCurationBanner";
import {
  hasFindingsSnapshotInsightDensityContent,
  type FindingsSnapshotInsightDensityView,
} from "@/lib/findings/findings-snapshot-insight-density";
import { hasFindingsWhatIfAnalysisContent } from "@/lib/findings/findings-what-if-analysis";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { RunDecisionExplainabilitySection } from "@/components/runs/RunDecisionExplainabilitySection";
import type { RunDecisionExplainabilityModel } from "@/lib/runs/run-decision-explainability-from-detail";
import { cn } from "@/lib/utils";

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
  readonly analysisStagesComplete?: boolean;
  readonly triageVisibleCount?: number;
  readonly graphSnapshot?: unknown;
  readonly requestAssumptionTexts?: readonly string[];
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
  } = props;
  const findingTitlesById = buildFindingTitlesById(quickDecisionFindings);
  const showCoverageAndCuration = hasFindingsSnapshotInsightDensityContent(insightDensityView);
  const showImpactAnalysis = hasFindingsWhatIfAnalysisContent(
    quickDecisionFindings,
    baselineAnnualCostUsd,
  );

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
          manifestRuleSetId={manifestRuleSetId}
          manifestRuleSetVersion={manifestRuleSetVersion}
          providerNeutralWorkItems={providerNeutralWorkItems}
          architectureWorkItemContext={architectureWorkItemContext}
          packageCommitted={packageCommitted}
          analysisStagesComplete={analysisStagesComplete}
          triageVisibleCount={triageVisibleCount}
          graphSnapshot={graphSnapshot}
          requestAssumptionTexts={props.requestAssumptionTexts}
        />

        {showCoverageAndCuration ? (
          <details
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-workspace-disclosure
            data-testid="run-detail-coverage-curation-disclosure"
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
        defaultOpen={false}
        sectionTestId="run-detail-assessment-narrative"
      >
        <RunDetailSponsorModeExplanationCard
          explanationSummary={explanationSummary}
          findings={quickDecisionFindings}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
        {explanationFailure ? (
          <>
            <p className={cn("m-0 mb-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Aggregate explanation could not be loaded.
            </p>
            <OperatorApiProblem
              problem={explanationFailure.problem}
              fallbackMessage={explanationFailure.message}
              correlationId={explanationFailure.correlationId}
              variant="warning"
            />
            <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              The review and manifest loaded, but the explanation aggregate request failed (HTTP / transport / 404).
            </p>
            <OperatorSectionRetryButton label="Retry loading explanation" />
          </>
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
                  defaultOpen={false}
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
