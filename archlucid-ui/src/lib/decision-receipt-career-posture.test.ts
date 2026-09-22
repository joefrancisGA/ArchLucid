import { describe, expect, it } from "vitest";

import { resolveDecisionReceiptCareerPosture } from "./decision-receipt-career-posture";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("decisionReceiptCareerPosture (CG-025)", () => {
  it("marks rehearsal simulator receipts incomplete", () => {
    const posture = resolveDecisionReceiptCareerPosture({
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      liveDoor: "rehearsal",
    });

    expect(posture.structuralExecutionMode).toBe(StructuralExecutionModeWire.Simulator);
    expect(posture.workingCareerRehearsalDoor).toBe("rehearsal");
    expect(posture.rehearsalIncomplete).toBe(true);
  });

  it("does not mark real career receipts rehearsal incomplete", () => {
    const posture = resolveDecisionReceiptCareerPosture({
      structuralExecutionMode: StructuralExecutionModeWire.Real,
      liveDoor: "career",
    });

    expect(posture.structuralExecutionMode).toBe(StructuralExecutionModeWire.Real);
    expect(posture.workingCareerRehearsalDoor).toBe("career");
    expect(posture.rehearsalIncomplete).toBe(false);
  });
});
