import {
  StructuralExecutionModeWire,
  type StructuralExecutionModeWireValue,
} from "@/lib/structural-execution-mode";

/** Canonical buyer-facing proof-confidence classes (aligned with release claim gate wording). */
export type ProofConfidenceClass =
  | "full-real-mode"
  | "partial-real-mode"
  | "simulator-only"
  | "unknown";

export const PROOF_CONFIDENCE_FIELD_LABEL = "Proof confidence";

/** Display labels — keep in sync with docs/quality/RELEASE_CLAIM_GATE.md §3 and scripts/ci/check_proof_confidence_taxonomy_drift.py */
export const PROOF_CONFIDENCE_LABELS: Record<ProofConfidenceClass, string> = {
  "full-real-mode": "Real-mode verified",
  "partial-real-mode": "Mixed evidence",
  "simulator-only": "Simulator-only",
  unknown: "Evidence not classified",
};

export const CANONICAL_PROOF_CONFIDENCE_LABELS: readonly string[] = Object.values(
  PROOF_CONFIDENCE_LABELS,
);

export type ProofConfidenceInput = {
  readonly structuralExecutionMode?: string | number | null;
  readonly realModeFellBackToSimulator?: boolean;
  readonly claimWordingClass?: string | null;
};

function normalizeStructuralExecutionMode(
  raw: string | number | null | undefined,
): StructuralExecutionModeWireValue | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw as StructuralExecutionModeWireValue;
  }

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === "real" || normalized === "1") {
    return StructuralExecutionModeWire.Real;
  }

  if (normalized === "simulator" || normalized === "0") {
    return StructuralExecutionModeWire.Simulator;
  }

  if (normalized === "fallback" || normalized === "2") {
    return StructuralExecutionModeWire.Fallback;
  }

  if (normalized === "mixed" || normalized === "3") {
    return StructuralExecutionModeWire.Mixed;
  }

  return null;
}

function proofConfidenceFromClaimWordingClass(
  claimWordingClass: string | null | undefined,
): ProofConfidenceClass | null {
  if (typeof claimWordingClass !== "string" || claimWordingClass.trim().length === 0) {
    return null;
  }

  const normalized = claimWordingClass.trim().toLowerCase();

  if (normalized === "full-real-mode") {
    return "full-real-mode";
  }

  if (normalized === "partial-real-mode") {
    return "partial-real-mode";
  }

  if (normalized === "simulator-only") {
    return "simulator-only";
  }

  return null;
}

function proofConfidenceFromStructuralMode(
  mode: StructuralExecutionModeWireValue | null,
  realModeFellBackToSimulator: boolean,
): ProofConfidenceClass {
  if (realModeFellBackToSimulator) {
    return "partial-real-mode";
  }

  switch (mode) {
    case StructuralExecutionModeWire.Real:
      return "full-real-mode";

    case StructuralExecutionModeWire.Simulator:
      return "simulator-only";

    case StructuralExecutionModeWire.Fallback:
    case StructuralExecutionModeWire.Mixed:
      return "partial-real-mode";

    default:
      return "unknown";
  }
}

export function resolveProofConfidenceClass(input: ProofConfidenceInput): ProofConfidenceClass {
  const fromClaim = proofConfidenceFromClaimWordingClass(input.claimWordingClass);

  if (fromClaim !== null) {
    return fromClaim;
  }

  const mode = normalizeStructuralExecutionMode(input.structuralExecutionMode);
  const fallback = input.realModeFellBackToSimulator === true;

  return proofConfidenceFromStructuralMode(mode, fallback);
}

export function formatProofConfidenceLabel(input: ProofConfidenceInput): string {
  const proofClass = resolveProofConfidenceClass(input);

  return PROOF_CONFIDENCE_LABELS[proofClass];
}

/** Maps trust-evidence card execution status text to the canonical proof-confidence label. */
export function formatProofConfidenceLabelFromTrustStatus(status: string | null | undefined): string {
  if (typeof status !== "string" || status.trim().length === 0) {
    return PROOF_CONFIDENCE_LABELS.unknown;
  }

  const normalized = status.trim().toLowerCase();

  if (
    normalized.includes("fallback")
    || normalized.includes("mixed")
    || normalized.includes("partial")
  ) {
    return formatProofConfidenceLabel({ structuralExecutionMode: StructuralExecutionModeWire.Mixed });
  }

  if (normalized.includes("simulator") || normalized.includes("demo")) {
    return formatProofConfidenceLabel({ structuralExecutionMode: StructuralExecutionModeWire.Simulator });
  }

  if (normalized.includes("real") || normalized.includes("live")) {
    return formatProofConfidenceLabel({ structuralExecutionMode: StructuralExecutionModeWire.Real });
  }

  return PROOF_CONFIDENCE_LABELS.unknown;
}
