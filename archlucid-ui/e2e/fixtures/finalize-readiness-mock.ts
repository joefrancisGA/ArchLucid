/** Deterministic finalize readiness payload for mock E2E deep-link smoke. */
export function buildFinalizeReadinessBlockedMock(
  runId: string,
  block: {
    readonly layer: string;
    readonly code: string;
    readonly message: string;
  },
): Record<string, unknown> {
  return {
    runId,
    readyToFinalize: false,
    blockedReasonSummary: block.message,
    blocks: [block],
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
      openDeferredCount: 0,
      openContradictionCount: 0,
      openCannotDetermineCount: 0,
      openVerifyHypothesisCount: 0,
      unverifiedAssumptionCount: 0,
      lowExtractionConfidenceCount: 0,
      unresolvedHighSeverityDispositionCount: 0,
    },
    scorecardBlockingReasons: block.code === "scorecard" ? [block.message] : [],
    finalizeQualityGateEnabled: true,
  };
}

export function buildFinalizeReadinessDeferredBlockMock(runId: string): Record<string, unknown> {
  return buildFinalizeReadinessBlockedMock(runId, {
    layer: "scorecard",
    code: "scorecard",
    message: "1 deferred finding still needs revisit.",
  });
}
