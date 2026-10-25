export const DECISION_TRACE_ID_NOT_STORED_LABEL = "Decision trace id was not stored." as const;

export function formatDecisionTraceExportLine(decisionTraceId: string | null | undefined): string {
  const trimmed = decisionTraceId?.trim() ?? "";

  if (trimmed.length === 0) {
    return DECISION_TRACE_ID_NOT_STORED_LABEL;
  }

  return trimmed;
}
