"use client";

import { useLayoutEffect } from "react";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { OperatorEvidenceLimitsFooter } from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IMPACT_PREVIEW_DETAIL_LOAD_RETRY_LABEL,
  IMPACT_PREVIEW_LIST_LOAD_RETRY_LABEL,
  IMPACT_PREVIEW_ORIENTATION,
  IMPACT_PREVIEW_PAGE_TITLE,
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_SIMULATE_RETRY_LABEL,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";
import { setImpactPreviewShellPageState } from "@/lib/impact-preview-route-shell-state";
import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";
import { resolveImpactPreviewPageState } from "@/lib/resolve-impact-preview-page-state";
import { resolveImpactPreviewRecommendation } from "@/lib/resolve-impact-preview-recommendation";
import { resolveImpactPreviewSummaryMetrics } from "@/lib/resolve-impact-preview-summary-metrics";
import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";
import { ImpactPreviewBuyerChrome } from "./ImpactPreviewBuyerChrome";
import { ImpactPreviewEmptyState } from "./ImpactPreviewEmptyState";
import { ImpactPreviewEvidenceBasisSection } from "./ImpactPreviewEvidenceBasisSection";
import { ImpactPreviewHowItWorksSection } from "./ImpactPreviewHowItWorksSection";
import { ImpactPreviewLoadFailurePanel } from "./ImpactPreviewLoadFailurePanel";
import { ImpactPreviewOutputPreviewPanel } from "./ImpactPreviewOutputPreviewPanel";
import { ImpactPreviewPageHeader } from "./ImpactPreviewPageHeader";
import { ImpactPreviewRecommendationSection } from "./ImpactPreviewRecommendationSection";
import { ImpactPreviewResultActions } from "./ImpactPreviewResultActions";
import { ImpactPreviewResultsSkeleton } from "./ImpactPreviewResultsSkeleton";
import { ImpactPreviewSetupCard } from "./ImpactPreviewSetupCard";
import { ImpactPreviewSetupSkeleton } from "./ImpactPreviewSetupSkeleton";
import { ImpactPreviewSimulationResultsSection } from "./ImpactPreviewSimulationResultsSection";
import { ImpactPreviewSummaryRow } from "./ImpactPreviewSummaryRow";
import { useImpactPreviewBaselineAvailability } from "./use-impact-preview-baseline-availability";
import { useIsOperatorNavHrefReachable } from "./use-is-operator-nav-href-reachable";

type Props = {
  readonly model: EvolutionReviewPageViewModel;
};

function impactPreviewHeaderStatus(pageState: ImpactPreviewPageState): EnterpriseStatusKind | null {
  switch (pageState) {
    case "no_baseline":
    case "no_candidates":
      return "needs-attention";

    case "permission_denied":
      return "blocked";

    case "ready":
      return null;

    default: {
      const exhaustive: never = pageState;
      return exhaustive;
    }
  }
}

function shouldShowBlockedOutputPreview(pageState: ImpactPreviewPageState): boolean {
  return pageState === "no_baseline" || pageState === "no_candidates";
}

/**
 * Impact preview: compare proposed architecture changes against a baseline review.
 */
export function EvolutionReviewPageView(props: Props): React.JSX.Element {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const canSimulate = useOperateCapability();
  const planningReachable = useIsOperatorNavHrefReachable(IMPACT_PREVIEW_PLANNING_HREF);
  const baselineAvailability = useImpactPreviewBaselineAvailability();

  const pageState = resolveImpactPreviewPageState({
    candidateCount: m.candidates.length,
    listLoading: m.listLoading,
    listFailure: m.listFailure,
    baselineLoading: baselineAvailability.loading,
    finalizedBaselineCount: baselineAvailability.finalizedCount,
  });
  const pageReady = pageState === "ready";

  useLayoutEffect(() => {
    setImpactPreviewShellPageState(pageState);

    return () => {
      setImpactPreviewShellPageState("unknown");
    };
  }, [pageState]);

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability={IMPACT_PREVIEW_PAGE_TITLE}
        description="In a connected tenant, architects preview the estimated impact of a proposed architecture change with a before-and-after comparison."
      />
    );
  }

  const selectedRun =
    m.detail !== null
      ? (m.detail.simulationRuns ?? []).find((run) => run.baselineArchitectureRunId === m.selectedBaselineId) ??
        (m.detail.simulationRuns ?? [])[0] ??
        null
      : null;

  const hasSimulationResults = selectedRun !== null;
  const summaryMetrics = resolveImpactPreviewSummaryMetrics(selectedRun, m.planSnapshot);
  const recommendation = resolveImpactPreviewRecommendation(selectedRun?.evaluationScore);
  const showSetupSkeleton = pageReady && m.listLoading && m.candidates.length > 0;
  const showResultsSkeleton =
    pageReady &&
    m.detailLoading &&
    (hasSimulationResults || (m.detail?.simulationRuns.length ?? 0) > 0);

  return (
    <div className="max-w-5xl space-y-5" data-testid="impact-preview-page">
      <ImpactPreviewPageHeader
        subtitle={impactPreviewPageSubtitle(buyerPolishedShell)}
        listLoading={m.listLoading}
        lastRefreshedAt={m.lastRefreshedAt}
        statusKind={impactPreviewHeaderStatus(pageState)}
        onRefresh={() => {
          void m.loadList();
        }}
      />

      <ImpactPreviewBuyerChrome />

      {pageReady ? (
        <>
          {!buyerPolishedShell ? <ImpactPreviewCompareVocabularyRail currentSurfaceId="impact-preview" /> : null}
          <PageCapabilityBoundaryStrip surfaceId="impactPreview" />

          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {IMPACT_PREVIEW_ORIENTATION}
          </p>
          {!buyerPolishedShell ? <ImpactPreviewHowItWorksSection /> : null}
        </>
      ) : null}

      {m.listLoading && m.candidates.length === 0 && pageReady ? (
        <OperatorLoadingNotice>
          <strong>Loading proposed changes.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching proposed architecture changes…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.listFailure !== null ? (
        <ImpactPreviewLoadFailurePanel
          failure={m.listFailure}
          retryLabel={IMPACT_PREVIEW_LIST_LOAD_RETRY_LABEL}
          testId="impact-preview-list-load-failure"
          retryTestId="impact-preview-list-load-retry"
          retryDisabled={m.listLoading}
          onRetry={() => {
            void m.loadList();
          }}
        />
      ) : null}

      {m.simulateFailure !== null ? (
        <ImpactPreviewLoadFailurePanel
          failure={m.simulateFailure}
          retryLabel={IMPACT_PREVIEW_SIMULATE_RETRY_LABEL}
          testId="impact-preview-simulate-failure"
          retryTestId="impact-preview-simulate-retry"
          retryDisabled={m.simulateBusy}
          onRetry={() => {
            void m.onSimulate();
          }}
        />
      ) : null}

      <ImpactPreviewEmptyState pageState={pageState} planningReachable={planningReachable} />

      {shouldShowBlockedOutputPreview(pageState) ? <ImpactPreviewOutputPreviewPanel /> : null}

      {!pageReady && !buyerPolishedShell ? (
        <ImpactPreviewCompareVocabularyRail currentSurfaceId="impact-preview" />
      ) : null}

      {pageReady ? (
        <>
          {showSetupSkeleton ? (
            <ImpactPreviewSetupSkeleton />
          ) : (
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
          )}

          {!hasSimulationResults ? <ImpactPreviewOutputPreviewPanel /> : null}

          {m.detailFailure !== null ? (
            <ImpactPreviewLoadFailurePanel
              failure={m.detailFailure}
              retryLabel={IMPACT_PREVIEW_DETAIL_LOAD_RETRY_LABEL}
              testId="impact-preview-detail-load-failure"
              retryTestId="impact-preview-detail-load-retry"
              retryDisabled={m.detailLoading}
              onRetry={() => {
                void m.loadDetail();
              }}
            />
          ) : null}

          {m.detail !== null && m.detailLoading && m.detail.simulationRuns.length === 0 ? (
            <OperatorLoadingNotice>
              <strong>Loading simulation results.</strong>
            </OperatorLoadingNotice>
          ) : null}

          {showResultsSkeleton ? <ImpactPreviewResultsSkeleton /> : null}

          {hasSimulationResults && !showResultsSkeleton ? (
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
              {m.selectedBaselineId !== null ? (
                <OperatorEvidenceLimitsFooter
                  runId={m.selectedBaselineId}
                  showArchitectureReviewSummaryLink={false}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
