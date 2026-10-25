export const EVALUATION_TRACE_NOT_STORED = "Evaluation trace was not stored." as const;

export const EVALUATION_TRACE_STORED_EMPTY = "Evaluation trace was stored empty." as const;

export function formatQuickDecisionEvaluationTraceLabel(
  traceConfidenceLabel: string | null | undefined,
): string {
  if (traceConfidenceLabel === null || traceConfidenceLabel === undefined) {
    return EVALUATION_TRACE_NOT_STORED;
  }

  if (traceConfidenceLabel.trim().length === 0) {
    return EVALUATION_TRACE_STORED_EMPTY;
  }

  return traceConfidenceLabel.trim();
}
