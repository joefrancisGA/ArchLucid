import { isApiRequestError } from "@/lib/api-request-error";

import type { ValueReportActionError } from "./value-report-action-error";

export function toValueReportActionError(e: unknown, fallbackMessage: string): ValueReportActionError {
  if (isApiRequestError(e)) {
    return {
      correlationId: e.correlationId,
      message: e.message,
      problem: e.problem,
    };
  }

  return {
    correlationId: null,
    message: e instanceof Error ? e.message : fallbackMessage,
    problem: null,
  };
}
