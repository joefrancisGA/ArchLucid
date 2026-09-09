import { describe, expect, it } from "vitest";

import {
  formatSimulatorRehearsalCareerBlockedReason,
  isRehearsalStructuralExecutionMode,
  shouldBlockWorkingCareerForSimulatorRehearsal,
  SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON,
} from "@/lib/governance/simulator-career-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("simulator-career-honesty (LP-06)", () => {
  it("treats Simulator and Fallback as rehearsal modes", () => {
    expect(isRehearsalStructuralExecutionMode(StructuralExecutionModeWire.Simulator)).toBe(true);
    expect(isRehearsalStructuralExecutionMode(0)).toBe(true);
    expect(isRehearsalStructuralExecutionMode(StructuralExecutionModeWire.Fallback)).toBe(true);
    expect(isRehearsalStructuralExecutionMode(StructuralExecutionModeWire.Real)).toBe(false);
    expect(isRehearsalStructuralExecutionMode(StructuralExecutionModeWire.Mixed)).toBe(false);
  });

  it("blocks Working simulator career paths without rehearsal banner on artifact", () => {
    expect(
      shouldBlockWorkingCareerForSimulatorRehearsal({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(true);

    expect(
      formatSimulatorRehearsalCareerBlockedReason({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        artifactKind: "export",
      }),
    ).toBe(SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON);
  });

  it("allows Working simulator career paths when rehearsal banner is on the artifact", () => {
    expect(
      shouldBlockWorkingCareerForSimulatorRehearsal({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        simulatorRehearsalBannerOnArtifact: true,
      }),
    ).toBe(false);
  });

  it("does not block guided simulator paths", () => {
    expect(
      shouldBlockWorkingCareerForSimulatorRehearsal({
        workingDesk: false,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(false);
  });
});
