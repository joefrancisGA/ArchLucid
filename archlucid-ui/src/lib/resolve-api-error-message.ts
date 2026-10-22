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

/**
 * Pre-release diagnostic message: keeps the user-facing fallback and appends HTTP status,
 * Problem Details, and correlation id when available so local debugging is not a guessing game.
 */
export function formatVerboseApiFailureMessage(error: unknown, fallback: string): string {
  const summary = resolveApiErrorMessage(error, fallback);
  const lines: string[] = [fallback];

  if (summary !== fallback && summary.trim().length > 0) {
    lines.push(summary.trim());
  }

  if (isApiRequestError(error)) {
    const title = error.problem?.title?.trim() ?? "";
    const type = error.problem?.type?.trim() ?? "";

    lines.push(`HTTP ${error.httpStatus}`);

    if (title.length > 0 && !lines.includes(title)) {
      lines.push(`Title: ${title}`);
    }

    if (type.length > 0 && type !== "about:blank") {
      lines.push(`Type: ${type}`);
    }

    if (error.correlationId !== null && error.correlationId.trim().length > 0) {
      lines.push(`Correlation ID: ${error.correlationId.trim()}`);
    }

    if (
      error.message.trim().length > 0 &&
      error.message.trim() !== summary &&
      error.message.trim() !== fallback
    ) {
      lines.push(error.message.trim());
    }
  } else if (error instanceof Error && error.message.trim().length > 0 && error.message.trim() !== fallback) {
    if (!lines.includes(error.message.trim())) {
      lines.push(error.message.trim());
    }
  } else if (typeof error === "string" && error.trim().length > 0 && error.trim() !== fallback) {
    lines.push(error.trim());
  }

  return lines.join("\n");
}
