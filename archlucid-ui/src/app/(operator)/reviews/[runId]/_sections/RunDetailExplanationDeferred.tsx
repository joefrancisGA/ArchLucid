import {
  buildFindingWireSnapshotsForRunDetail,
  isQuickDecisionDerivedFromExplanationTraces,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import { resolveFindingsSnapshotInsightDensityView } from "@/lib/findings-snapshot-insight-density";
import { deriveRunDetailBaselineAnnualCostUsd } from "@/lib/derive-run-detail-baseline-cost";
import { resolveRunDecisionExplainabilityFromDetail } from "@/lib/run-decision-explainability-from-detail";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { RunDetailRunExplanationCollapsible } from "./RunDetailRunExplanationCollapsible";

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
    explanationSummary,
    explanationFailure,
    findingCountDisplay,
    warningCountDisplay,
    goldenManifestJsonForExport,
    manifestRuleSetId,
    manifestRuleSetVersion,
  } = props;

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
    <RunDetailRunExplanationCollapsible
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
    />
  );
}
