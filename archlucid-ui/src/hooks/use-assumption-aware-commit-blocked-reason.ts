"use client";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { TransparencyTrail } from "@/types/feasibility-verdict";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

import { useFinalizeReadiness } from "@/hooks/use-finalize-readiness";
import { useReviewAssumptionAcknowledgements } from "@/hooks/use-review-assumption-acknowledgements";

export type AssumptionAwareCommitBlockedState = {
  readonly blockedReason: string | null;
  readonly blocks: readonly FinalizeReadinessBlock[];
  readonly readinessLoading: boolean;
  readonly readinessUnavailable: boolean;
};

const READINESS_UNAVAILABLE_MESSAGE =
  "Could not verify finalize readiness from the server. Refresh the page and try again before finalizing.";

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
}): AssumptionAwareCommitBlockedState {
  const { acknowledgedIds } = useReviewAssumptionAcknowledgements(input.runId);
  const { readiness, loading } = useFinalizeReadiness({
    runId: input.runId,
    enabled: input.finalizeAssumptionGateApplies,
    acknowledgedAssumptionIds: acknowledgedIds,
  });

  if (input.serverCommitBlockedReason !== null && input.serverCommitBlockedReason !== undefined) {
    return {
      blockedReason: input.serverCommitBlockedReason,
      blocks: [],
      readinessLoading: false,
      readinessUnavailable: false,
    };
  }

  if (!input.finalizeAssumptionGateApplies) {
    return {
      blockedReason: null,
      blocks: [],
      readinessLoading: false,
      readinessUnavailable: false,
    };
  }

  if (loading) {
    return {
      blockedReason: null,
      blocks: [],
      readinessLoading: true,
      readinessUnavailable: false,
    };
  }

  if (readiness !== null) {
    return {
      blockedReason: readiness.blockedReasonSummary,
      blocks: readiness.blocks,
      readinessLoading: false,
      readinessUnavailable: false,
    };
  }

  return {
    blockedReason: READINESS_UNAVAILABLE_MESSAGE,
    blocks: [],
    readinessLoading: false,
    readinessUnavailable: true,
  };
}
