import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

import { countSkippedMustQuestions } from "./count-skipped-must-questions";
import { evaluateFinalizeQualityScorecard } from "./finalize-quality-scorecard";
import {
  deriveFinalizeQualityScorecardInput,
  type DeriveFinalizeQualityScorecardOptions,
} from "./finalize-quality-scorecard-from-findings";

export type ResolveClientAwareCommitBlockedReasonInput = {
  readonly serverCommitBlockedReason: string | null;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly blockingFindingCount: number;
  readonly acknowledgedAssumptionIds: ReadonlySet<string>;
  readonly requestAssumptionTexts: readonly string[];
  readonly transparencyTrail?: TransparencyTrail | null;
};

/** Recompute finalize scorecard on the client when assumption acks change (TB-2314). */
export function resolveClientAwareCommitBlockedReason(
  input: ResolveClientAwareCommitBlockedReasonInput,
): string | null {
  if (!input.finalizeAssumptionGateApplies) {
    return input.serverCommitBlockedReason;
  }

  const scorecardOptions: DeriveFinalizeQualityScorecardOptions = {
    acknowledgedAssumptionIds: input.acknowledgedAssumptionIds,
    requestAssumptionTexts: input.requestAssumptionTexts,
  };
  const scorecardInput = deriveFinalizeQualityScorecardInput(
    input.findings,
    input.blockingFindingCount,
    scorecardOptions,
  );
  const scorecard = evaluateFinalizeQualityScorecard({
    ...scorecardInput,
    skippedMustCount: countSkippedMustQuestions(input.transparencyTrail),
  });

  return scorecard.ready ? null : scorecard.blockingReasons.join(" ");
}
