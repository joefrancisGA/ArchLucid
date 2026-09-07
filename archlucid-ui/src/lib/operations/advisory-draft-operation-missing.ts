import { ApiRequestError } from "@/lib/api-request-error";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_OPERATION_MISSING } from "@/lib/guided-intake-copy";

/** Returns true when a poll hit a missing advisory draft operation (404). */
export function isAdvisoryDraftOperationMissingError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.httpStatus === 404;
}

/** Buyer-facing recovery copy when the server no longer knows about an in-flight suggest operation. */
export function advisoryDraftOperationMissingMessage(): string {
  return GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_OPERATION_MISSING;
}
