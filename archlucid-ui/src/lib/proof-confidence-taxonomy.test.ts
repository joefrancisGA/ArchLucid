import { describe, expect, it } from "vitest";

import {
  CANONICAL_PROOF_CONFIDENCE_LABELS,
  formatProofConfidenceLabel,
  PROOF_CONFIDENCE_LABELS,
  resolveProofConfidenceClass,
} from "@/lib/proof-confidence-taxonomy";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("proof-confidence-taxonomy", () => {
  it("exposes the three buyer-facing confidence labels plus unknown", () => {
    expect(CANONICAL_PROOF_CONFIDENCE_LABELS).toEqual([
      "Real-mode verified",
      "Mixed evidence",
      "Simulator-only",
      "Evidence not classified",
    ]);
  });

  it("maps structural execution modes to canonical proof-confidence classes", () => {
    expect(
      resolveProofConfidenceClass({ structuralExecutionMode: StructuralExecutionModeWire.Real }),
    ).toBe("full-real-mode");
    expect(
      resolveProofConfidenceClass({ structuralExecutionMode: StructuralExecutionModeWire.Simulator }),
    ).toBe("simulator-only");
    expect(
      resolveProofConfidenceClass({ structuralExecutionMode: StructuralExecutionModeWire.Mixed }),
    ).toBe("partial-real-mode");
    expect(
      resolveProofConfidenceClass({ structuralExecutionMode: StructuralExecutionModeWire.Fallback }),
    ).toBe("partial-real-mode");
    expect(resolveProofConfidenceClass({ structuralExecutionMode: "Real" })).toBe("full-real-mode");
    expect(resolveProofConfidenceClass({})).toBe("unknown");
  });

  it("prefers claim wording class when supplied", () => {
    expect(
      resolveProofConfidenceClass({
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        claimWordingClass: "simulator-only",
      }),
    ).toBe("simulator-only");
  });

  it("treats simulator fallback as mixed evidence", () => {
    expect(
      resolveProofConfidenceClass({
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        realModeFellBackToSimulator: true,
      }),
    ).toBe("partial-real-mode");
    expect(formatProofConfidenceLabel({ realModeFellBackToSimulator: true })).toBe(
      PROOF_CONFIDENCE_LABELS["partial-real-mode"],
    );
  });
});
