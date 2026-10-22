import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { IN_FLIGHT_OPERATION_ATTEMPT_CLOCK_TOLERANCE_MS } from "@/lib/operations/is-in-flight-operation-for-attempt";
import { parseOperationHeartbeatMs } from "@/lib/operations/parse-operation-heartbeat-ms";
import type { OperationDetail } from "@/lib/operations/operation-state";

function isHeartbeatBeforeAttempt(
  heartbeatUtc: string | null | undefined,
  attemptStartedAtMs: number,
): boolean {
  const heartbeatMs = parseOperationHeartbeatMs(heartbeatUtc);

  if (heartbeatMs === null) {
    return true;
  }

  return heartbeatMs < attemptStartedAtMs - IN_FLIGHT_OPERATION_ATTEMPT_CLOCK_TOLERANCE_MS;
}

/**
 * True when GET /v1/operations still projects the previous attempt's Failed state.
 * Re-runs reuse run:{runId}; LegacyRunStatus stays Failed until the async worker advances.
 */
export function isStaleReRunFailureOperationPoll(
  row: TrackedInFlightOperation,
  detail: Pick<OperationDetail, "state" | "heartbeatUtc">,
): boolean {
  if (detail.state !== "Failed") {
    return false;
  }

  return isHeartbeatBeforeAttempt(detail.heartbeatUtc, row.startedAtMs);
}

/** Client-side guard when applying terminal Failed from the in-flight store to re-run outcome UI. */
export function isStaleFailedOperationForAttempt(
  operation: TrackedInFlightOperation,
  attemptStartedAtMs: number,
): boolean {
  if (operation.state !== "Failed") {
    return false;
  }

  return isHeartbeatBeforeAttempt(operation.heartbeatUtc, attemptStartedAtMs);
}
