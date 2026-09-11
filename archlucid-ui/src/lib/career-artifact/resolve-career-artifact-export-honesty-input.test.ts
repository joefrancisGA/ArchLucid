import { describe, expect, it } from "vitest";

import { resolveCareerArtifactExportHonestyDoorFields } from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("resolveCareerArtifactExportHonestyDoorFields (CG-022)", () => {
  it("prefers stamped door over live chooser for sponsor export honesty", () => {
    const resolved = resolveCareerArtifactExportHonestyDoorFields({
      progressSummary: {
        runId: "run-1",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        workingCareerRehearsalDoor: "career",
      },
      liveDoor: "rehearsal",
    });

    expect(resolved.effectiveWorkingCareerRehearsalDoor).toBe("career");
    expect(resolved.structuralExecutionMode).toBe(StructuralExecutionModeWire.Simulator);
  });

  it("falls back to live door when no execute stamp exists", () => {
    const resolved = resolveCareerArtifactExportHonestyDoorFields({
      progressSummary: {
        runId: "run-1",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      },
      liveDoor: "rehearsal",
    });

    expect(resolved.effectiveWorkingCareerRehearsalDoor).toBe("rehearsal");
  });
});
