export function formatDegradedFindingCoverageBlockedReason(
  failedEngineLabels: readonly string[],
): string {
  const labelText =
    failedEngineLabels.length > 0
      ? failedEngineLabels.join(", ")
      : "one or more finding engines";

  return `Finding coverage is degraded. Failed engines: ${labelText}. Finalize is blocked until coverage is restored.`;
}
