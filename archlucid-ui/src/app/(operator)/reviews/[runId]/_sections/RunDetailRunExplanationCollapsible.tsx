import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FindingsWhatIfAnalysisPanel } from "@/components/FindingsWhatIfAnalysisPanel";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
import { RunExplanationSection } from "@/components/RunExplanationSection";
import { RunFindingExplainabilityTable } from "@/components/RunFindingExplainabilityTable";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";

import { RunDetailSponsorModeExplanationCard } from "./RunDetailSponsorModeExplanationCard";

type RunDetailRunExplanationCollapsibleProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly quickDecisionFindings: QuickDecisionFinding[];
  readonly findingWireSnapshots: Record<string, FindingWireSnapshot>;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly explanationFailure: ApiLoadFailureState | null;
  readonly baselineAnnualCostUsd: number | null;
  readonly isIllustrativePricing?: boolean;
};

export function RunDetailRunExplanationCollapsible(
  props: RunDetailRunExplanationCollapsibleProps,
): ReactElement | null {
  const {
    runId,
    buyerPolishedArtifactTable,
    quickDecisionFindings,
    findingWireSnapshots,
    findingCountDisplay,
    warningCountDisplay,
    explanationSummary,
    explanationFailure,
    baselineAnnualCostUsd,
    isIllustrativePricing,
  } = props;

  return (
    <section id="run-explanation" className="scroll-mt-24">
      <CollapsibleSection
        title={buyerPolishedArtifactTable ? "Findings & assessment" : "Architecture review summary"}
        defaultOpen={buyerPolishedArtifactTable}
      >
        <FindingsWhatIfAnalysisPanel findings={quickDecisionFindings} baselineAnnualCostUsd={baselineAnnualCostUsd} isIllustrativePricing={isIllustrativePricing} />
        <RunDetailSponsorModeExplanationCard
          explanationSummary={explanationSummary}
          findings={quickDecisionFindings}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
        <QuickDecisionSummary
          runId={runId}
          findings={quickDecisionFindings}
          buyerPolishedShell={buyerPolishedArtifactTable}
          headlineFindingCount={findingCountDisplay}
          headlineWarningCount={warningCountDisplay}
        />
        {explanationFailure ? (
          <>
            <p className="m-0 mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Aggregate explanation could not be loaded.
            </p>
            <OperatorApiProblem
              problem={explanationFailure.problem}
              fallbackMessage={explanationFailure.message}
              correlationId={explanationFailure.correlationId}
              variant="warning"
            />
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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
                <RunFindingExplainabilityTable
                  runId={runId}
                  rows={traceRows}
                  findingWireSnapshots={findingWireSnapshots}
                />
              );
            })()}
          </>
        ) : null}
      </CollapsibleSection>
    </section>
  );
}
