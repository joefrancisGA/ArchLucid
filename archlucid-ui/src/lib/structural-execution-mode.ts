/** OpenAPI `StructuralExecutionMode` enum wire values (INV-002). */
export const StructuralExecutionModeWire = {
  Simulator: 0,
  Real: 1,
  Fallback: 2,
  Mixed: 3,
} as const;

export type StructuralExecutionModeWireValue =
  (typeof StructuralExecutionModeWire)[keyof typeof StructuralExecutionModeWire];

export function formatStructuralExecutionModeLabel(
  mode: number | null | undefined,
): string {
  switch (mode) {
    case StructuralExecutionModeWire.Real:
      return "Real";
    case StructuralExecutionModeWire.Fallback:
      return "Fallback";
    case StructuralExecutionModeWire.Mixed:
      return "Mixed";
    case StructuralExecutionModeWire.Simulator:
      return "Simulator";
    default:
      return "Unknown";
  }
}

export function structuralExecutionModeBadgeTitle(mode: number | null | undefined): string {
  const label = formatStructuralExecutionModeLabel(mode);

  switch (mode) {
    case StructuralExecutionModeWire.Real:
      return `${label} execution — agent steps used the configured model path for this run.`;
    case StructuralExecutionModeWire.Fallback:
      return `${label} execution — real path was attempted but this run recorded simulator substitution.`;
    case StructuralExecutionModeWire.Mixed:
      return `${label} execution — some agent steps used deterministic substitution while others used the model path. Treat highlights conservatively.`;
    case StructuralExecutionModeWire.Simulator:
      return `${label} execution — deterministic analysis path (repeatable, no billable model usage for those steps).`;
    default:
      return "Execution mode label unavailable for this run.";
  }
}
