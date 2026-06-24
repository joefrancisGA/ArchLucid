/** Human-readable descriptions for authority replay modes (API enum names stay in `value` attributes). */
const REPLAY_MODE_LABELS: Record<string, string> = {
  ReconstructOnly:
    "Validate only — checks stored evidence, findings, and review record without regenerating outputs.",
  RebuildManifest:
    "Rebuild evidence trail — replay and regenerate the signed review record from stored inputs.",
  RebuildArtifacts:
    "Regenerate exported artifacts — includes review record rebuild and export synthesis where applicable.",
};

/** Short labels for the validation mode `<select>` (technical enum value stays the `value` attribute). */
export const REPLAY_MODE_PLAIN_OPTIONS: readonly { readonly mode: string; readonly label: string }[] = [
  { mode: "ReconstructOnly", label: "Validate only" },
  { mode: "RebuildManifest", label: "Rebuild evidence trail" },
  { mode: "RebuildArtifacts", label: "Regenerate exported artifacts" },
];

/** Returns a short operator-facing sentence for the replay mode, or the raw mode string if unknown. */
export function replayModeLabel(mode: string): string {
  const label = REPLAY_MODE_LABELS[mode];

  if (label !== undefined) {
    return label;
  }

  return mode;
}

/** Returns the short select label for a replay mode (no API enum name). */
export function replayModeShortLabel(mode: string): string {
  const option = REPLAY_MODE_PLAIN_OPTIONS.find((row) => row.mode === mode);

  if (option !== undefined) {
    return option.label;
  }

  return mode;
}

/** Primary action label for the validate/replay form button. */
export function replayValidationActionLabel(mode: string, loading: boolean): string {
  if (loading) {
    return "Validating…";
  }

  if (mode === "ReconstructOnly") {
    return "Validate review package";
  }

  return "Run validation";
}

/** Sorts validation note lines for a stable bullet list across reloads. */
export function sortReplayNotes(notes: string[]): string[] {
  return [...notes].sort((a, b) => a.localeCompare(b, "en"));
}
