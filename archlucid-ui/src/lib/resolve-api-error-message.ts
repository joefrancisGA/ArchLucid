import { isApiRequestError } from "@/lib/api-request-error";

/**
 * Resolves a short operator-facing message from a caught API failure.
 * Prefers ProblemDetails `detail` when present; otherwise falls back to the error message or caller default.
 */
export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiRequestError(error)) {
    const detail = error.problem?.detail?.trim();

    if (detail !== undefined && detail.length > 0) {
      return detail;
    }

    const message = error.message.trim();

    if (message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error) {
    const message = error.message.trim();

    if (message.length > 0) {
      return message;
    }
  }

  return fallback;
}
