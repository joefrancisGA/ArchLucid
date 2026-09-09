export const ARCHITECT_RESTATEMENT_TRAIL_BACKED_HONESTY_LABEL =
  "Operator restatement (disposition audit trail) — not sealed engine prose.";

export const ARCHITECT_RESTATEMENT_NOT_TRAIL_BACKED_HONESTY_LABEL =
  "Operator restatement — not sealed engine prose.";

export type ArchitectRestatementExportHonestyInput = {
  readonly isTrailBacked: boolean;
};

export function resolveArchitectRestatementExportHonestyLabel(
  input: ArchitectRestatementExportHonestyInput,
): string {
  return input.isTrailBacked
    ? ARCHITECT_RESTATEMENT_TRAIL_BACKED_HONESTY_LABEL
    : ARCHITECT_RESTATEMENT_NOT_TRAIL_BACKED_HONESTY_LABEL;
}
