import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";

/** Small tolerance for clock skew between click time and store registration. */
export const IN_FLIGHT_OPERATION_ATTEMPT_CLOCK_TOLERANCE_MS = 1_000;

/**
 * True when a tracked shell operation belongs to the current user-initiated attempt.
 * Re-runs reuse the same operation id — ignore terminal rows from earlier attempts.
 */
export function isInFlightOperationForAttempt(
  operation: TrackedInFlightOperation | null | undefined,
  attemptStartedAtMs: number,
): operation is TrackedInFlightOperation {
  if (operation === null || operation === undefined) {
    return false;
  }

  if (!Number.isFinite(attemptStartedAtMs)) {
    return false;
  }

  return (
    operation.startedAtMs >= attemptStartedAtMs - IN_FLIGHT_OPERATION_ATTEMPT_CLOCK_TOLERANCE_MS
  );
}
