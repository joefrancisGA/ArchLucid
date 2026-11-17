export function formatDegradedFindingCoverageBlockedReason(
  failedEngineLabels: readonly string[] | null | undefined,
): string {
  let labelText: string;

  if (failedEngineLabels === null || failedEngineLabels === undefined) {
    labelText = "Failed engine labels were not stored.";
  } else if (failedEngineLabels.length === 0) {
    labelText = "one or more finding engines";
  } else {
    labelText = failedEngineLabels.join(", ");
  }

  return `Finding coverage is degraded. Failed engines: ${labelText}. Finalize is blocked until coverage is restored.`;
}
