import { isApiRequestError } from "@/lib/api-request-error";

import type { PilotValueReportPilotPageError } from "./pilot-value-report-pilot-page-view-model";

export function toPilotValueReportPilotPageError(e: unknown): PilotValueReportPilotPageError {
  if (isApiRequestError(e)) {
    return {
      message: e.message,
      problem: e.problem,
      correlationId: e.correlationId,
    };
  }

  return {
    message: e instanceof Error ? e.message : "Could not load pilot value report.",
    problem: null,
    correlationId: null,
  };
}
