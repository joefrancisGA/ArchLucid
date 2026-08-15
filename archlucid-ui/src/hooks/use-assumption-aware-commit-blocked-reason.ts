"use client";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { useReviewAssumptionAcknowledgements } from "@/hooks/use-review-assumption-acknowledgements";
import { resolveClientAwareCommitBlockedReason } from "@/lib/review-quality/resolve-client-commit-blocked-reason";

export function useAssumptionAwareCommitBlockedReason(input: {
  readonly runId: string;
  readonly serverCommitBlockedReason: string | null | undefined;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly blockingFindingCount: number;
  readonly requestAssumptionTexts: readonly string[];
}): string | null {
  const { acknowledgedIds } = useReviewAssumptionAcknowledgements(input.runId);

  return resolveClientAwareCommitBlockedReason({
    serverCommitBlockedReason: input.serverCommitBlockedReason ?? null,
    finalizeAssumptionGateApplies: input.finalizeAssumptionGateApplies,
    findings: input.findings,
    blockingFindingCount: input.blockingFindingCount,
    acknowledgedAssumptionIds: acknowledgedIds,
    requestAssumptionTexts: input.requestAssumptionTexts,
  });
}
