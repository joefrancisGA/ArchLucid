"use client";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IMPACT_PREVIEW_ORIENTATION,
  IMPACT_PREVIEW_PAGE_TITLE,
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_TRUST_NOTICE,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";
import { resolveImpactPreviewPageState } from "@/lib/resolve-impact-preview-page-state";
import { resolveImpactPreviewRecommendation } from "@/lib/resolve-impact-preview-recommendation";
import { resolveImpactPreviewSummaryMetrics } from "@/lib/resolve-impact-preview-summary-metrics";
import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";
import { ImpactPreviewEmptyState } from "./ImpactPreviewEmptyState";
import { ImpactPreviewEvidenceBasisSection } from "./ImpactPreviewEvidenceBasisSection";
import { ImpactPreviewHowItWorksSection } from "./ImpactPreviewHowItWorksSection";
import { ImpactPreviewOutputPreviewPanel } from "./ImpactPreviewOutputPreviewPanel";
import { ImpactPreviewPageHeader } from "./ImpactPreviewPageHeader";
import { ImpactPreviewRecommendationSection } from "./ImpactPreviewRecommendationSection";
import { ImpactPreviewResultActions } from "./ImpactPreviewResultActions";
import { ImpactPreviewSetupCard } from "./ImpactPreviewSetupCard";
import { ImpactPreviewSimulationResultsSection } from "./ImpactPreviewSimulationResultsSection";
import { ImpactPreviewSummaryRow } from "./ImpactPreviewSummaryRow";
import { useImpactPreviewBaselineAvailability } from "./use-impact-preview-baseline-availability";
import { useIsOperatorNavHrefReachable } from "./use-is-operator-nav-href-reachable";
type Props = {
  readonly model: EvolutionReviewPageViewModel;
};

/**
 * Impact preview: compare proposed architecture changes against a baseline review.
 */
export function EvolutionReviewPageView(props: Props): React.JSX.Element {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const canSimulate = useOperateCapability();
  const planningReachable = useIsOperatorNavHrefReachable(IMPACT_PREVIEW_PLANNING_HREF);
  const baselineAvailability = useImpactPreviewBaselineAvailability();

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability={IMPACT_PREVIEW_PAGE_TITLE}
        description="In a connected tenant, architects preview the estimated impact of a proposed architecture change with a before-and-after comparison."
      />
    );
  }

  const pageState = resolveImpactPreviewPageState({
    candidateCount: m.candidates.length,
    listLoading: m.listLoading,
    listFailure: m.listFailure,
    baselineLoading: baselineAvailability.loading,
    finalizedBaselineCount: baselineAvailability.finalizedCount,
  });

  const selectedRun =
    m.detail !== null
      ? (m.detail.simulationRuns ?? []).find((run) => run.baselineArchitectureRunId === m.selectedBaselineId) ??
        (m.detail.simulationRuns ?? [])[0] ??
        null
      : null;

  const hasSimulationResults = selectedRun !== null;
  const summaryMetrics = resolveImpactPreviewSummaryMetrics(selectedRun, m.planSnapshot);
  const recommendation = resolveImpactPreviewRecommendation(selectedRun?.evaluationScore);

  return (
    <div className="max-w-5xl space-y-5" data-testid="impact-preview-page">
      <ImpactPreviewPageHeader
        subtitle={impactPreviewPageSubtitle(buyerPolishedShell)}
        listLoading={m.listLoading}
        lastRefreshedAt={m.lastRefreshedAt}
        onRefresh={() => {
          void m.loadList();
        }}
      />

      <ImpactPreviewCompareVocabularyRail currentSurfaceId="impact-preview" />
      <PageCapabilityBoundaryStrip surfaceId="impactPreview" />

      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {IMPACT_PREVIEW_ORIENTATION}
      </p>
      <p className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {IMPACT_PREVIEW_TRUST_NOTICE}
      </p>
      {!buyerPolishedShell ? <ImpactPreviewHowItWorksSection /> : null}

      {m.listLoading && m.candidates.length === 0 && pageState === "ready" ? (
        <OperatorLoadingNotice>
          <strong>Loading proposed changes.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching proposed architecture changes…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.listFailure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.listFailure.problem}
            fallbackMessage={m.listFailure.message}
            correlationId={m.listFailure.correlationId}
          />
        </div>
      ) : null}

      {m.simulateFailure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.simulateFailure.problem}
            fallbackMessage={m.simulateFailure.message}
            correlationId={m.simulateFailure.correlationId}
          />
        </div>
      ) : null}

      <ImpactPreviewEmptyState pageState={pageState} planningReachable={planningReachable} />

      {pageState === "ready" ? (
        <>
          <ImpactPreviewSetupCard
            candidates={m.candidates}
            selectedCandidateId={m.selectedId}
            onSelectCandidate={(candidateId) => {
              m.setSelectedId(candidateId);
            }}
            baselineOptions={m.baselineOptions}
            selectedBaselineId={m.selectedBaselineId}
            onSelectBaseline={(baselineId) => {
              m.setSelectedBaselineId(baselineId);
            }}
            comparisonScope={m.comparisonScope}
            onToggleScope={m.toggleComparisonScope}
            canSimulate={canSimulate}
            simulateBusy={m.simulateBusy}
            listLoading={m.listLoading}
            onSimulate={() => {
              void m.onSimulate();
            }}
          />

          {!hasSimulationResults ? <ImpactPreviewOutputPreviewPanel /> : null}

          {m.detailFailure !== null ? (
            <div role="alert">
              <OperatorApiProblem
                problem={m.detailFailure.problem}
                fallbackMessage={m.detailFailure.message}
                correlationId={m.detailFailure.correlationId}
              />
            </div>
          ) : null}

          {m.detail !== null && m.detailLoading && m.detail.simulationRuns.length === 0 ? (
            <OperatorLoadingNotice>
              <strong>Loading simulation results.</strong>
            </OperatorLoadingNotice>
          ) : null}

          {hasSimulationResults ? (
            <>
              <ImpactPreviewSummaryRow metrics={summaryMetrics} />
              <ImpactPreviewSimulationResultsSection
                detail={m.detail!}
                detailLoading={m.detailLoading}
                planSnapshot={m.planSnapshot}
                selectedBaselineId={m.selectedBaselineId}
                comparisonScope={m.comparisonScope}
              />
              <ImpactPreviewRecommendationSection
                recommendation={recommendation}
                explanation={selectedRun?.evaluationExplanationSummary ?? null}
              />
              <ImpactPreviewEvidenceBasisSection
                baselineRunId={m.selectedBaselineId}
                linkedRunIds={m.planSnapshot?.linkedArchitectureRunIds ?? []}
                policyRulesLabel="Open governance workflow"
              />
              {m.selectedId !== null ? <ImpactPreviewResultActions selectedCandidateId={m.selectedId} /> : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
