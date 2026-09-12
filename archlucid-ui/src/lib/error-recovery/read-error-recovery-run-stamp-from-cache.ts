import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { RunSummary } from "@/types/authority";

export type ErrorRecoveryRunStamp = {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
};

function stampFromRunSummary(summary: RunSummary | undefined): ErrorRecoveryRunStamp | null {
  if (summary === undefined) {
    return null;
  }

  if (
    (summary.structuralExecutionMode === undefined || summary.structuralExecutionMode === null)
    && (summary.workingCareerRehearsalDoor === undefined || summary.workingCareerRehearsalDoor === null)
  ) {
    return null;
  }

  return {
    structuralExecutionMode: summary.structuralExecutionMode,
    workingCareerRehearsalDoor: summary.workingCareerRehearsalDoor ?? null,
  };
}

function stampFromPilotRunDeltas(
  payload: PilotRunDeltasProofSummaryJson | undefined,
): ErrorRecoveryRunStamp | null {
  if (payload === undefined) {
    return null;
  }

  const structuralExecutionMode = payload.structuralExecutionMode;

  if (structuralExecutionMode === undefined || structuralExecutionMode === null) {
    return null;
  }

  return {
    structuralExecutionMode,
    workingCareerRehearsalDoor: null,
  };
}

/** CG-096 — best-effort cached execute stamp for error recovery (no network fetch). */
export function readErrorRecoveryRunStampFromCache(
  runId: string,
  scope: OperatorScopeQueryKey,
): ErrorRecoveryRunStamp | null {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  const queryClient = getOperatorQueryClient();
  const summaryStamp = stampFromRunSummary(
    queryClient.getQueryData<RunSummary>(operatorQueryKeys.runSummary(trimmedRunId)),
  );

  if (summaryStamp !== null) {
    return summaryStamp;
  }

  return stampFromPilotRunDeltas(
    queryClient.getQueryData<PilotRunDeltasProofSummaryJson>(
      operatorQueryKeys.pilotRunDeltas(scope, trimmedRunId),
    ),
  );
}
