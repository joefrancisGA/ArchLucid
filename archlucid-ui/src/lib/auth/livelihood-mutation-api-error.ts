import { isApiRequestError } from "@/lib/api-request-error";

/** Livelihood 401 resume requires the raw {@link ApiRequestError} — mapped Error drops httpStatus. */
export function rethrowLivelihoodMutate401(error: unknown): void {
  if (isApiRequestError(error) && error.httpStatus === 401) {
    throw error;
  }
}
