import { RULE_BASED_ANALYSIS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

/** OpenAPI `StructuralExecutionMode` enum wire values (INV-002). */
export const StructuralExecutionModeWire = {
  Simulator: "Simulator",
  Real: "Real",
  Fallback: "Fallback",
  Mixed: "Mixed",
} as const;

export type StructuralExecutionModeWireValue =
  (typeof StructuralExecutionModeWire)[keyof typeof StructuralExecutionModeWire];

/** Accept string OpenAPI values and legacy numeric fixtures during the enum migration. */
export type StructuralExecutionModeInput =
  | StructuralExecutionModeWireValue
  | number
  | null
  | undefined;

/** Marker phrase in within-run Mixed operator badge copy (TB-971). */
export const EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER = "deterministic substitution";

function normalizeStructuralExecutionMode(
  mode: StructuralExecutionModeInput,
): StructuralExecutionModeWireValue | null {
  if (mode === StructuralExecutionModeWire.Simulator || mode === 0) {
    return StructuralExecutionModeWire.Simulator;
  }

  if (mode === StructuralExecutionModeWire.Real || mode === 1) {
    return StructuralExecutionModeWire.Real;
  }

  if (mode === StructuralExecutionModeWire.Fallback || mode === 2) {
    return StructuralExecutionModeWire.Fallback;
  }

  if (mode === StructuralExecutionModeWire.Mixed || mode === 3) {
    return StructuralExecutionModeWire.Mixed;
  }

  return null;
}

/** Operator / diagnostics label — wire enum name preserved for support and API parity. */
export function formatStructuralExecutionModeLabel(
  mode: StructuralExecutionModeInput,
): string {
  switch (normalizeStructuralExecutionMode(mode)) {
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

/** Buyer-facing execution mode label — Simulator reads as rule-based analysis, not a demo mode. */
export function formatStructuralExecutionModeBuyerLabel(
  mode: StructuralExecutionModeInput,
): string {
  switch (normalizeStructuralExecutionMode(mode)) {
    case StructuralExecutionModeWire.Real:
      return "Live analysis";
    case StructuralExecutionModeWire.Fallback:
      return "Fallback";
    case StructuralExecutionModeWire.Mixed:
      return "Mixed";
    case StructuralExecutionModeWire.Simulator:
      return RULE_BASED_ANALYSIS_BUYER_LABEL;
    default:
      return "Unknown";
  }
}

export function structuralExecutionModeBadgeTitle(mode: StructuralExecutionModeInput): string {
  const normalized = normalizeStructuralExecutionMode(mode);
  const label = formatStructuralExecutionModeLabel(mode);

  switch (normalized) {
    case StructuralExecutionModeWire.Real:
      return `${label} execution — agent steps used the configured model path for this review.`;
    case StructuralExecutionModeWire.Fallback:
      return `${label} execution — real path was attempted but this review recorded simulator substitution.`;
    case StructuralExecutionModeWire.Mixed:
      return `${label} execution — some agent steps used ${EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER} while others used the model path. Treat highlights conservatively.`;
    case StructuralExecutionModeWire.Simulator:
      return `${label} execution — deterministic analysis path (repeatable, no billable model usage for those steps).`;
    default:
      return "Execution mode label unavailable for this review.";
  }
}
