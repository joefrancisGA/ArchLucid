import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export function architectureIntelligenceErrorToLoadFailure(message: string): ApiLoadFailureState {
  return {
    message,
    problem: null,
    correlationId: null,
    httpStatus: null,
    retryAfterSeconds: null,
  };
}

export function shouldClearIntakeWhenInboundRunIdDropped(
  previousInboundRunId: string,
  inboundRunId: string,
  urlContextRunId: string,
  activeRunId: string | null,
): boolean {
  return (
    previousInboundRunId.length > 0 &&
    inboundRunId.length === 0 &&
    urlContextRunId.length > 0 &&
    urlContextRunId !== previousInboundRunId &&
    urlContextRunId !== (activeRunId?.trim() ?? "")
  );
}
