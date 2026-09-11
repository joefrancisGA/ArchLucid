import { describe, expect, it } from "vitest";

import {
  formatSimulatorRehearsalCareerBlockedReason,
  isRehearsalStructuralExecutionMode,
  presentDecisionGradeSemanticSupportBand,
  shouldBlockWorkingCareerForSimulatorRehearsal,
  SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON,
  SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL,
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

  it("blocks Working Career simulator paths without rehearsal banner on artifact (CG-021)", () => {
    expect(
      shouldBlockWorkingCareerForSimulatorRehearsal({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "career",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(true);

    expect(
      formatSimulatorRehearsalCareerBlockedReason({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "career",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        artifactKind: "export",
      }),
    ).toBe(SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON);
  });

  it("allows Working Rehearsal simulator finalize without explicit banner (LP-06 / CG-021)", () => {
    expect(
      shouldBlockWorkingCareerForSimulatorRehearsal({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(false);
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

describe("simulator semantic support band presentation (AS-068)", () => {
  it("keeps Real wire bands on career surfaces", () => {
    const presentation = presentDecisionGradeSemanticSupportBand({
      wireBand: "Supported",
      structuralExecutionMode: StructuralExecutionModeWire.Real,
    });

    expect(presentation.label).toBe("Supported");
    expect(presentation.isRehearsalPresentation).toBe(false);
  });

  it("relabels Supported wire bands on Simulator rehearsal", () => {
    const presentation = presentDecisionGradeSemanticSupportBand({
      wireBand: "Supported",
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
    });

    expect(presentation.label).toBe(SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL);
    expect(presentation.isRehearsalPresentation).toBe(true);
    expect(presentation.label).not.toBe("Supported");
  });

  it("keeps NotScored label on Simulator while adding rehearsal reason", () => {
    const presentation = presentDecisionGradeSemanticSupportBand({
      wireBand: "NotScored",
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
    });

    expect(presentation.label).toBe("Not scored");
    expect(presentation.isRehearsalPresentation).toBe(true);
  });
});
