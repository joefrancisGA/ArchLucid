import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { deriveRunDetailBaselineAnnualCostUsd } from "@/lib/derive-run-detail-baseline-cost";
import { resolveFindingsSnapshotInsightDensityView } from "@/lib/findings/findings-snapshot-insight-density";
import {
  buildFindingWireSnapshotsForRunDetail,
  isQuickDecisionDerivedFromExplanationTraces,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import { resolveRunDecisionExplainabilityFromDetail } from "@/lib/runs/run-decision-explainability-from-detail";
import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { loadRunDetailExplanationSummary } from "./load-run-detail-explanation-summary";
import { tryStaticDemoExplanationSummary } from "@/lib/operator/operator-static-demo";
import { tryLoadRequestAssumptionsForRun } from "@/lib/try-load-request-assumptions-for-run";
import { RunDetailRunExplanationCollapsibleDeferred } from "./run-detail-page-view-deferred-chunks";

type RunDetailExplanationDeferredProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly resolvedDetail: RunDetail;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly explanationFailure: ApiLoadFailureState | null;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly goldenManifestJsonForExport: unknown | null;
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
  readonly requestAssumptionTexts?: readonly string[];
};

/**
 * Async Server Component that defers the expensive finding-scan derivations
 * (findingWireSnapshots, insightDensityView, quickDecisionFindings) out of the
 * critical-path render so first-screen chrome paints before these complete.
 *
 * Wrap this in a Suspense boundary with RunDetailExplanationSkeleton as fallback.
 */
export async function RunDetailExplanationDeferred(
  props: RunDetailExplanationDeferredProps,
): Promise<React.JSX.Element | null> {
  const {
    runId,
    buyerPolishedArtifactTable,
    resolvedDetail,
    findingCountDisplay,
    warningCountDisplay,
    goldenManifestJsonForExport,
    manifestRuleSetId,
    manifestRuleSetVersion,
    providerNeutralWorkItems,
    architectureWorkItemContext,
    packageCommitted,
    manifestIdForExportGuard,
    analysisStagesComplete,
    triageVisibleCount,
    requestAssumptionTexts,
  } = props;

  const resolvedRequestAssumptionTexts =
    requestAssumptionTexts ?? await tryLoadRequestAssumptionsForRun(runId);

  let explanationSummary = props.explanationSummary;
  let explanationFailure = props.explanationFailure ?? null;

  if (explanationSummary === null && explanationFailure === null) {
    const loaded = await loadRunDetailExplanationSummary(runId);

    explanationSummary = loaded.summary;
    explanationFailure = loaded.failure;

    if (
      explanationSummary !== null &&
      explanationFailure === null &&
      (explanationSummary.findingCount ?? 0) === 0
    ) {
      const staticExplanation = tryStaticDemoExplanationSummary(runId);

      if (staticExplanation !== null && (staticExplanation.findingCount ?? 0) > 0) {
        explanationSummary = staticExplanation;
      }
    }
  }

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(resolvedDetail, explanationSummary);
  const quickDecisionFromExplanationFallback = isQuickDecisionDerivedFromExplanationTraces(
    resolvedDetail,
    explanationSummary,
  );
  const findingWireSnapshots = buildFindingWireSnapshotsForRunDetail(resolvedDetail, explanationSummary);
  const insightDensityView = resolveFindingsSnapshotInsightDensityView(resolvedDetail);

  const { baselineAnnualCostUsd, isIllustrativePricing } = deriveRunDetailBaselineAnnualCostUsd({
    savingsSummaryAnnualizedUsd: undefined,
    goldenManifestJson: goldenManifestJsonForExport,
  });

  const decisionExplainability = resolveRunDecisionExplainabilityFromDetail(resolvedDetail);

  return (
    <RunDetailRunExplanationCollapsibleDeferred
      runId={runId}
      buyerPolishedArtifactTable={buyerPolishedArtifactTable}
      quickDecisionFindings={quickDecisionFindings}
      quickDecisionFromExplanationFallback={quickDecisionFromExplanationFallback}
      findingWireSnapshots={findingWireSnapshots}
      findingCountDisplay={findingCountDisplay}
      warningCountDisplay={warningCountDisplay}
      explanationSummary={explanationSummary}
      explanationFailure={explanationFailure}
      baselineAnnualCostUsd={baselineAnnualCostUsd}
      isIllustrativePricing={isIllustrativePricing}
      decisionExplainability={decisionExplainability}
      insightDensityView={insightDensityView}
      manifestRuleSetId={manifestRuleSetId}
      manifestRuleSetVersion={manifestRuleSetVersion}
      providerNeutralWorkItems={providerNeutralWorkItems}
      architectureWorkItemContext={architectureWorkItemContext}
      packageCommitted={packageCommitted}
      manifestIdForExportGuard={manifestIdForExportGuard}
      analysisStagesComplete={analysisStagesComplete}
      triageVisibleCount={triageVisibleCount}
      graphSnapshot={resolvedDetail.graphSnapshot}
      requestAssumptionTexts={resolvedRequestAssumptionTexts}
    />
  );
}
