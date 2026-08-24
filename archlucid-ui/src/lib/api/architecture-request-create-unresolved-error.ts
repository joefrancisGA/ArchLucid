import type { ApiProblemDetails } from "@/lib/api-problem";
import { ApiRequestError } from "@/lib/api-request-error";

import { REVIEW_START_UNRESOLVED_MESSAGE } from "@/lib/review-start-progress-copy";

/** Thrown when sync create hits the proxy ceiling — client wait unresolved, not server failure. */
export class ArchitectureRequestCreateUnresolvedError extends ApiRequestError {
  constructor(options: {
    problem: ApiProblemDetails | null;
    correlationId: string | null;
    httpStatus: number;
    retryAfterSeconds?: number | null;
  }) {
    super(REVIEW_START_UNRESOLVED_MESSAGE, options);
    this.name = "ArchitectureRequestCreateUnresolvedError";
  }
}

export function isArchitectureRequestCreateUnresolvedError(
  error: unknown,
): error is ArchitectureRequestCreateUnresolvedError {
  return error instanceof ArchitectureRequestCreateUnresolvedError;
}
