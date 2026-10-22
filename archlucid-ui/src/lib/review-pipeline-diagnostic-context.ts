import type { RunDetail } from "@/types/authority";

import type { ReviewPipelineDiagnosticContext } from "./review-pipeline-stall-diagnosis";

/** Maps run detail into the stall diagnosis / dev telemetry context shape. */
export function reviewPipelineDiagnosticContextFromRunDetail(
  run: RunDetail["run"] | null | undefined,
  traceId?: string | null,
): ReviewPipelineDiagnosticContext | null {
  if (run === null || run === undefined) {
    return null;
  }

  const runRecord = run as RunDetail["run"] & {
    isDeadLettered?: boolean | null;
    lastFailureReason?: string | null;
    otelTraceId?: string | null;
  };

  return {
    legacyRunStatus: runRecord.legacyRunStatus ?? null,
    isDeadLettered: runRecord.isDeadLettered ?? null,
    lastFailureReason: runRecord.lastFailureReason ?? null,
    otelTraceId: traceId ?? runRecord.otelTraceId ?? null,
    retryCount: runRecord.retryCount ?? null,
  };
}
