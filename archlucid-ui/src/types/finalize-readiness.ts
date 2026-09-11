import type { PreFinalizeChecklistResult } from "@/types/pre-finalize-checklist";

export type FinalizeReadinessBlock = {
  readonly code: string;
  readonly message: string;
  readonly layer: string;
};

export type FinalizeQualityScorecardCountsDto = {
  readonly blockingFindingCount: number;
  readonly uncoveredMandatoryRequirementCount: number;
  readonly openDeferredCount: number;
  readonly openContradictionCount: number;
  readonly openCannotDetermineCount: number;
  readonly openVerifyHypothesisCount: number;
  readonly unverifiedAssumptionCount: number;
  readonly lowExtractionConfidenceCount: number;
  readonly unresolvedHighSeverityDispositionCount: number;
};

export type FinalizeReadinessResult = {
  readonly runId: string;
  readonly readyToFinalize: boolean;
  readonly blockedReasonSummary: string | null;
  readonly blocks: readonly FinalizeReadinessBlock[];
  readonly checklist: PreFinalizeChecklistResult;
  readonly scorecard: FinalizeQualityScorecardCountsDto;
  readonly scorecardBlockingReasons: readonly string[];
  readonly finalizeQualityGateEnabled: boolean;
};
