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
