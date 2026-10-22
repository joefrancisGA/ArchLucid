import type { components } from "@/lib/openapi-schemas";

import type { PreFinalizeChecklistResult } from "@/types/pre-finalize-checklist";

type FinalizeReadinessBlockSchema = components["schemas"]["FinalizeReadinessBlock"];

export type FinalizeReadinessBlock = FinalizeReadinessBlockSchema &
  Required<Pick<FinalizeReadinessBlockSchema, "code" | "message" | "layer">>;

type FinalizeQualityScorecardCountsDtoSchema = components["schemas"]["FinalizeQualityScorecardCountsDto"];

export type FinalizeQualityScorecardCountsDto = FinalizeQualityScorecardCountsDtoSchema &
  Required<
    Pick<
      FinalizeQualityScorecardCountsDtoSchema,
      | "blockingFindingCount"
      | "uncoveredMandatoryRequirementCount"
      | "openDeferredCount"
      | "openContradictionCount"
      | "openCannotDetermineCount"
      | "openVerifyHypothesisCount"
      | "unverifiedAssumptionCount"
      | "lowExtractionConfidenceCount"
      | "unresolvedHighSeverityDispositionCount"
    >
  >;

type FinalizeReadinessResultSchema = components["schemas"]["FinalizeReadinessResult"];

export type FinalizeReadinessResult = Omit<FinalizeReadinessResultSchema, "checklist" | "blocks"> &
  Required<
    Pick<
      FinalizeReadinessResultSchema,
      "runId" | "readyToFinalize" | "finalizeQualityGateEnabled"
    >
  > & {
    readonly blockedReasonSummary: string | null;
    readonly blocks: readonly FinalizeReadinessBlock[];
    readonly checklist: PreFinalizeChecklistResult;
    readonly scorecard: FinalizeQualityScorecardCountsDto;
    readonly scorecardBlockingReasons: readonly string[];
  };
