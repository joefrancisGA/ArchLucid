export type FinalizeQualityScorecardInput = {
  readonly blockingFindingCount: number;
  readonly unverifiedAssumptionCount: number;
  readonly unacknowledgedExistentialAssumptionCount: number;
  readonly uncoveredMandatoryRequirementCount: number;
  readonly openCannotDetermineCount: number;
  readonly lowExtractionConfidenceCount: number;
};

export type FinalizeQualityScorecardResult = {
  readonly ready: boolean;
  readonly blockingReasons: readonly string[];
};

/** TB-2321: finalize checks a scorecard, not only blocking findings. */
export function evaluateFinalizeQualityScorecard(input: FinalizeQualityScorecardInput): FinalizeQualityScorecardResult {
  const blockingReasons: string[] = [];

  if (input.blockingFindingCount > 0) {
    const noun = input.blockingFindingCount === 1 ? "finding" : "findings";

    blockingReasons.push(
      `${input.blockingFindingCount} unresolved blocking ${noun} still need disposition.`,
    );
  }

  if (input.uncoveredMandatoryRequirementCount > 0) {
    blockingReasons.push(
      `${input.uncoveredMandatoryRequirementCount} mandatory requirement${input.uncoveredMandatoryRequirementCount === 1 ? "" : "s"} lack a design decision.`,
    );
  }

  if (input.openCannotDetermineCount > 0) {
    blockingReasons.push(
      `${input.openCannotDetermineCount} open question${input.openCannotDetermineCount === 1 ? "" : "s"} still need answers before the package is defensible.`,
    );
  }

  if (input.unverifiedAssumptionCount >= 3) {
    blockingReasons.push(
      `${input.unverifiedAssumptionCount} unverified assumptions remain — confirm or caveat existential ones before finalize.`,
    );
  }

  if (input.unacknowledgedExistentialAssumptionCount > 0) {
    const noun =
      input.unacknowledgedExistentialAssumptionCount === 1 ? "assumption" : "assumptions";

    blockingReasons.push(
      `${input.unacknowledgedExistentialAssumptionCount} existential ${noun} still need confirmation before finalize.`,
    );
  }

  if (input.lowExtractionConfidenceCount > 0) {
    blockingReasons.push(
      `${input.lowExtractionConfidenceCount} critical model field${input.lowExtractionConfidenceCount === 1 ? "" : "s"} were extracted with low confidence — caveat or re-ingest before sponsor export.`,
    );
  }

  return {
    ready: blockingReasons.length === 0,
    blockingReasons,
  };
}

export type ExtractionFidelityGateInput = {
  readonly lowConfidenceCriticalFieldCount: number;
  readonly extractionCaveatAcknowledged: boolean;
};

/** TB-2318: block sponsor export when critical extractions are low-confidence without caveat. */
export function isExtractionFidelityGateSatisfied(input: ExtractionFidelityGateInput): boolean {
  if (input.lowConfidenceCriticalFieldCount <= 0) {
    return true;
  }

  return input.extractionCaveatAcknowledged;
}

export const EXTRACTION_FIDELITY_GATE_MESSAGE =
  "Critical architecture fields were extracted with low confidence. Acknowledge the caveat or add evidence before sponsor export.";
