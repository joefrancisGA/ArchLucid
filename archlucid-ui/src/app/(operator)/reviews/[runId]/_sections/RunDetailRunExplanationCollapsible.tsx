import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";
import { FindingsWhatIfAnalysisPanel } from "@/components/FindingsWhatIfAnalysisPanel";
import { cn } from "@/lib/utils";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
import { cn } from "@/lib/utils";
import { RunExplanationSection } from "@/components/RunExplanationSection";
import { cn } from "@/lib/utils";
import { RunFindingExplainabilityTable } from "@/components/RunFindingExplainabilityTable";
import { cn } from "@/lib/utils";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { CoverageChecklistPanel } from "@/components/usability/CoverageChecklistPanel";
import { cn } from "@/lib/utils";
import { InsightDensityCurationBanner } from "@/components/usability/InsightDensityCurationBanner";
import { cn } from "@/lib/utils";
import type { FindingsSnapshotInsightDensityView } from "@/lib/findings-snapshot-insight-density";
import { cn } from "@/lib/utils";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";
import type { RunExplanationSummary } from "@/types/explanation";
import { cn } from "@/lib/utils";
import { RunDecisionExplainabilitySection } from "@/components/RunDecisionExplainabilitySection";
import { cn } from "@/lib/utils";
import type { RunDecisionExplainabilityModel } from "@/lib/run-decision-explainability-from-detail";

import { cn } from "@/lib/utils";
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
      <CollapsibleSection
        title={buyerPolishedArtifactTable ? "Findings & assessment" : "Architecture review summary"}
        defaultOpen={buyerPolishedArtifactTable}
      >
        <InsightDensityCurationBanner curation={insightDensityView.curation} />
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
          usingExplanationFallback={quickDecisionFromExplanationFallback}
          manifestRuleSetId={manifestRuleSetId}
          manifestRuleSetVersion={manifestRuleSetVersion}
        />
        <CoverageChecklistPanel items={insightDensityView.checklistCoverage} className="mt-4" />
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
