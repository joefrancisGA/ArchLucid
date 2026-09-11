"use client";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

import { useFinalizeReadiness } from "@/hooks/use-finalize-readiness";
import { useReviewAssumptionAcknowledgements } from "@/hooks/use-review-assumption-acknowledgements";
import { resolveClientAwareCommitBlockedReason } from "@/lib/review-quality/resolve-client-commit-blocked-reason";

export function useAssumptionAwareCommitBlockedReason(input: {
  readonly runId: string;
  readonly serverCommitBlockedReason: string | null | undefined;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly blockingFindingCount: number;
  readonly requestAssumptionTexts: readonly string[];
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly degradedFindingCoverage?: boolean;
  readonly degradedFindingCoverageFailedEngineLabels?: readonly string[];
  readonly blockDegradedFindingCoverageOnWorking?: boolean;
}): string | null {
  const { acknowledgedIds } = useReviewAssumptionAcknowledgements(input.runId);
  const { readiness } = useFinalizeReadiness({
    runId: input.runId,
    enabled: input.finalizeAssumptionGateApplies,
    acknowledgedAssumptionIds: acknowledgedIds,
  });

  if (input.serverCommitBlockedReason !== null && input.serverCommitBlockedReason !== undefined) {
    return input.serverCommitBlockedReason;
  }

  if (readiness !== null) {
    return readiness.blockedReasonSummary;
  }

  return resolveClientAwareCommitBlockedReason({
    serverCommitBlockedReason: null,
    finalizeAssumptionGateApplies: input.finalizeAssumptionGateApplies,
    findings: input.findings,
    blockingFindingCount: input.blockingFindingCount,
    acknowledgedAssumptionIds: acknowledgedIds,
    requestAssumptionTexts: input.requestAssumptionTexts,
    transparencyTrail: input.transparencyTrail,
    degradedFindingCoverage: input.degradedFindingCoverage,
    degradedFindingCoverageFailedEngineLabels: input.degradedFindingCoverageFailedEngineLabels,
    blockDegradedFindingCoverageOnWorking: input.blockDegradedFindingCoverageOnWorking,
  });
}
