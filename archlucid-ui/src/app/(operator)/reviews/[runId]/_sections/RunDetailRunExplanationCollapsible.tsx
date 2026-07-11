import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FindingsWhatIfAnalysisPanel } from "@/components/FindingsWhatIfAnalysisPanel";
import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";
import { RunExplanationSection } from "@/components/RunExplanationSection";
import { RunFindingExplainabilityTable } from "@/components/RunFindingExplainabilityTable";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CoverageChecklistPanel } from "@/components/usability/CoverageChecklistPanel";
import { InsightDensityCurationBanner } from "@/components/usability/InsightDensityCurationBanner";
import type { FindingsSnapshotInsightDensityView } from "@/lib/findings-snapshot-insight-density";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { RunDecisionExplainabilitySection } from "@/components/RunDecisionExplainabilitySection";
import type { RunDecisionExplainabilityModel } from "@/lib/run-decision-explainability-from-detail";

import { RunDetailSponsorModeExplanationCard } from "./RunDetailSponsorModeExplanationCard";

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
};

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
  } = props;

  return (
    <section id="run-explanation" className="scroll-mt-24">
      <div className="mb-3">
        <h2 className={cn("m-0 text-lg font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          ArchLucid review
        </h2>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Findings, evidence, and governance outcomes from the completed analysis.
        </p>
      </div>
      <CollapsibleSection
        title={buyerPolishedArtifactTable ? "Findings" : "Findings and assessment"}
        defaultOpen
        sectionTestId="run-detail-findings-section"
      >
        <InsightDensityCurationBanner curation={insightDensityView.curation} />
        <FindingsWhatIfAnalysisPanel findings={quickDecisionFindings} baselineAnnualCostUsd={baselineAnnualCostUsd} isIllustrativePricing={isIllustrativePricing} />
        <RunDetailFindingsWorkspace
          runId={runId}
          findings={quickDecisionFindings}
          buyerPolishedShell={buyerPolishedArtifactTable}
          headlineFindingCount={findingCountDisplay}
          headlineWarningCount={warningCountDisplay}
          usingExplanationFallback={quickDecisionFromExplanationFallback}
          manifestRuleSetId={manifestRuleSetId}
          manifestRuleSetVersion={manifestRuleSetVersion}
        />
        <CoverageChecklistPanel items={insightDensityView.checklistCoverage} className="mt-4" />
      </CollapsibleSection>

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
            <RunExplanationSection
              summary={explanationSummary}
              loading={false}
              error={null}
              runId={runId}
              displayFindingCount={findingCountDisplay}
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
                  <RunFindingExplainabilityTable
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
