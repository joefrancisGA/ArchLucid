import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ReplayResponse } from "@/types/authority";

export type ReplayValidationModeId = "ReconstructOnly" | "RebuildManifest" | "RebuildArtifacts";

export type ReplayAiUsageLevel = "none" | "limited" | "full";

export type ReplayValidationOutcome =
  | "valid"
  | "valid_with_warnings"
  | "invalid"
  | "incomplete"
  | "failed"
  | "canceled";

export type ReplayValidationModeDefinition = {
  readonly mode: ReplayValidationModeId;
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly aiUsage: ReplayAiUsageLevel;
  readonly aiUsageLabel: string;
  readonly estimatedDurationLabel: string;
  readonly mutabilityLabel: string;
  readonly storedOutputLabel: string;
  readonly recordLabel: string;
  readonly actionLabel: string;
  readonly loadingActionLabel: string;
  readonly requiresModifyConfirmation: boolean;
};

export const REPLAY_VALIDATION_MODES: readonly ReplayValidationModeDefinition[] = [
  {
    mode: "ReconstructOnly",
    title: "Check stored package",
    summary: "Read-only validation of stored evidence, findings, decisions, links, and signed record.",
    bullets: [
      "Validates stored evidence, findings, decisions, links, and signed record",
      "Does not regenerate AI output",
      "No full-review AI budget usage",
    ],
    aiUsage: "none",
    aiUsageLabel: "None",
    estimatedDurationLabel: "Usually under 2 minutes",
    mutabilityLabel: "Read-only",
    storedOutputLabel: "Unchanged",
    recordLabel: "Adds a validation record in audit history",
    actionLabel: "Check stored package",
    loadingActionLabel: "Checking stored package…",
    requiresModifyConfirmation: false,
  },
  {
    mode: "RebuildManifest",
    title: "Rebuild derived outputs",
    summary: "Regenerates selected derived outputs and compares them with stored records.",
    bullets: [
      "Regenerates the signed review record and decision trace from stored inputs",
      "May consume AI budget",
      "Replaces or compares stored manifest outputs when differences are detected",
    ],
    aiUsage: "limited",
    aiUsageLabel: "Limited",
    estimatedDurationLabel: "Typically 3–10 minutes",
    mutabilityLabel: "May modify stored outputs",
    storedOutputLabel: "May replace derived review record outputs",
    recordLabel: "Creates a new validation record and may persist rebuilt outputs",
    actionLabel: "Rebuild outputs",
    loadingActionLabel: "Rebuilding outputs…",
    requiresModifyConfirmation: true,
  },
  {
    mode: "RebuildArtifacts",
    title: "Full regeneration",
    summary: "Runs the complete validation pipeline including exported artifacts.",
    bullets: [
      "Runs the complete validation pipeline",
      "Consumes AI budget",
      "May take longer and can replace exported artifacts",
    ],
    aiUsage: "full",
    aiUsageLabel: "Full",
    estimatedDurationLabel: "Often 10+ minutes",
    mutabilityLabel: "May modify stored outputs",
    storedOutputLabel: "May replace derived outputs and exported artifacts",
    recordLabel: "Creates a new validation record and may persist rebuilt outputs",
    actionLabel: "Run full validation",
    loadingActionLabel: "Running full validation…",
    requiresModifyConfirmation: true,
  },
] as const;

export function isReplayValidationModeId(value: string): value is ReplayValidationModeId {
  return value === "ReconstructOnly" || value === "RebuildManifest" || value === "RebuildArtifacts";
}

export function replayValidationModeDefinition(mode: string): ReplayValidationModeDefinition {
  const match = REPLAY_VALIDATION_MODES.find((row) => row.mode === mode);

  if (match !== undefined) {
    return match;
  }

  return REPLAY_VALIDATION_MODES[0];
}

export function replayValidationActionLabel(mode: string, loading: boolean): string {
  const definition = replayValidationModeDefinition(mode);

  if (loading) {
    return definition.loadingActionLabel;
  }

  return definition.actionLabel;
}

export function replayValidationOutcomeLabel(outcome: ReplayValidationOutcome): string {
  switch (outcome) {
    case "valid":
      return "Valid";
    case "valid_with_warnings":
      return "Valid with warnings";
    case "invalid":
      return "Invalid";
    case "incomplete":
      return "Incomplete";
    case "failed":
      return "Failed";
    case "canceled":
      return "Cancelled";
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
}

export function deriveReplayValidationOutcome(params: {
  readonly response: ReplayResponse | null;
  readonly failure: ApiLoadFailureState | null;
  readonly canceled?: boolean;
}): ReplayValidationOutcome | null {
  if (params.canceled === true) {
    return "cancelled";
  }

  if (params.failure !== null) {
    return "failed";
  }

  if (params.response === null) {
    return null;
  }

  const validation = params.response.validation;
  const criticalMissing =
    !validation.contextPresent ||
    !validation.findingsPresent ||
    !validation.manifestPresent ||
    !validation.tracePresent;

  if (!validation.manifestHashMatches || criticalMissing) {
    return "invalid";
  }

  const partialMissing =
    !validation.graphPresent || !validation.artifactsPresent || !validation.artifactBundlePresentAfterReplay;

  if (partialMissing) {
    return "incomplete";
  }

  if (validation.notes.length > 0 || validation.hasValidationNotes === true) {
    return "valid_with_warnings";
  }

  return "valid";
}

export type ReplayValidationHistoryEntry = {
  readonly id: string;
  readonly runId: string;
  readonly mode: string;
  readonly occurredUtc: string;
  readonly durationMs: number | null;
  readonly outcome: ReplayValidationOutcome;
  readonly aiUsageLabel: string;
  readonly initiatedBy: string;
  readonly source: "session" | "audit";
  readonly auditEventId?: string | null;
  readonly response?: ReplayResponse | null;
};

export function formatReplayDurationLabel(durationMs: number | null): string {
  if (durationMs === null || durationMs < 0) {
    return "—";
  }

  if (durationMs < 1000) {
    return "< 1 sec";
  }

  const totalSeconds = Math.round(durationMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
}

/** Sorts validation note lines for a stable bullet list across reloads. */
export function sortReplayNotes(notes: string[]): string[] {
  return [...notes].sort((a, b) => a.localeCompare(b, "en"));
}
