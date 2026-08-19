/** Distinct analytics / telemetry intents for architecture vs review workflows. */
export type ArchitectureWorkflowTelemetryIntent =
  | "CreateArchitecture"
  | "ContinueArchitecture"
  | "StartReview"
  | "ContinueReview";

export function telemetryIntentForArchitectureDraftNavigation(
  isExistingDraft: boolean,
): ArchitectureWorkflowTelemetryIntent {
  return isExistingDraft ? "ContinueArchitecture" : "CreateArchitecture";
}
