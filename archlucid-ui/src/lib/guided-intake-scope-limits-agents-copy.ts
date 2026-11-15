export function formatGuidedIntakeScopeLimitsAgentsHelper(input: {
  readonly focusedPilotModeEnabled: boolean;
  readonly isCreateArchitectureFlow: boolean;
}): string {
  if (input.focusedPilotModeEnabled) {
    return "Focused pilot mode limits which assurance agents run — only the pilot subset participates in this intake.";
  }

  if (input.isCreateArchitectureFlow) {
    return "Architecture scope and workspace policy packs bound which agents run — out-of-scope systems are not evaluated automatically.";
  }

  return "Policy pack assignments and architecture scope bound which agents run on this review.";
}