export function formatFindingInspectReasoningTraceDisplay(
  reasoningTrace: string | null | undefined,
): string {
  if (reasoningTrace === null || reasoningTrace === undefined) {
    return "Rationale trace was not stored on this finding.";
  }

  if (reasoningTrace.length === 0 || reasoningTrace.trim().length === 0) {
    return "Rationale trace was stored empty on this finding.";
  }

  return reasoningTrace;
}

export function isFindingInspectReasoningTraceRenderable(
  reasoningTrace: string | null | undefined,
): boolean {
  return (
    reasoningTrace !== null
    && reasoningTrace !== undefined
    && reasoningTrace.trim().length > 0
  );
}
