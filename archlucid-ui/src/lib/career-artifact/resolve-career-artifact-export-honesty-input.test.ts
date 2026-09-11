import { describe, expect, it } from "vitest";

import {
  resolveCareerArtifactExportHonestyDoorFields,
  resolveSimulatorRehearsalBannerOnArtifactForExport,
} from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
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

  it("sets simulator rehearsal banner only for Rehearsal door on Simulator (CG-024)", () => {
    expect(
      resolveSimulatorRehearsalBannerOnArtifactForExport({
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBe(false);

    expect(
      resolveSimulatorRehearsalBannerOnArtifactForExport({
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(true);
  });
});
