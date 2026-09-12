/** Deterministic finalize readiness payload for mock E2E deep-link smoke. */
export function buildFinalizeReadinessDeferredBlockMock(runId: string): Record<string, unknown> {
  return {
    runId,
    readyToFinalize: false,
    blockedReasonSummary: "1 deferred finding still needs revisit.",
    blocks: [
      {
        layer: "scorecard",
        code: "scorecard",
        message: "1 deferred finding still needs revisit.",
      },
    ],
    checklist: {
      runId,
      readyToFinalize: false,
      items: [],
      advisoryCount: 0,
      blockingCount: 1,
      preCommitGateEnabled: true,
    },
    scorecard: {
      blockingFindingCount: 0,
      uncoveredMandatoryRequirementCount: 0,
      openDeferredCount: 1,
      openContradictionCount: 0,
      openCannotDetermineCount: 0,
      openVerifyHypothesisCount: 0,
      unverifiedAssumptionCount: 0,
      lowExtractionConfidenceCount: 0,
      unresolvedHighSeverityDispositionCount: 0,
    },
    scorecardBlockingReasons: ["1 deferred finding still needs revisit."],
    finalizeQualityGateEnabled: true,
  };
}
