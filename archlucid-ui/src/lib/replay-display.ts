/** Human-readable labels for authority replay modes (matches API enum names). */
const REPLAY_MODE_LABELS: Record<string, string> = {
  ReconstructOnly:
    "Reconstruct only — replay pipeline steps without rebuilding the reviewed manifest or artifacts.",
  RebuildManifest:
    "Rebuild manifest — replay and regenerate the reviewed manifest from stored inputs.",
  RebuildArtifacts:
    "Rebuild artifacts — replay through manifest regeneration and artifact synthesis where applicable.",
};

/** Short labels for the replay mode `<select>` (technical enum value stays the `value` attribute). */
export const REPLAY_MODE_PLAIN_OPTIONS: readonly { readonly mode: string; readonly label: string }[] = [
  { mode: "ReconstructOnly", label: "Validate only — fastest; checks stored chain without regenerating outputs" },
  { mode: "RebuildManifest", label: "Rebuild reviewed manifest — use when you suspect manifest drift" },
  { mode: "RebuildArtifacts", label: "Rebuild artifacts — heaviest; use when exports must be regenerated" },
];

/** Returns a short operator-facing sentence for the replay mode, or the raw mode string if unknown. */
export function replayModeLabel(mode: string): string {
  const label = REPLAY_MODE_LABELS[mode];

  if (label !== undefined) {
    return label;
  }

  return mode;
}

/** Sorts validation note lines for a stable bullet list across reloads. */
export function sortReplayNotes(notes: string[]): string[] {
  return [...notes].sort((a, b) => a.localeCompare(b, "en"));
}
