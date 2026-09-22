import { describe, expect, it } from "vitest";

import {
  shouldBlockFinalizeForCareerHonesty,
  shouldSuppressReadyToFinalizeForCareerHonesty,
} from "@/lib/runs/run-pipeline-finalize-blocked-honesty";
import { SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON } from "@/lib/governance/simulator-career-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("shouldSuppressReadyToFinalizeForCareerHonesty (FC-70)", () => {
  it("suppresses Ready when transparency trail sections are incomplete", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        transparencyTrail: { asserted: [], inferred: undefined, skipped: [] } as never,
      }),
    ).toBe(true);
  });

  it("suppresses Ready when skipped MUST questions remain", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [{ questionKey: "drRpo", tier: "Must" }],
        },
      }),
    ).toBe(true);
  });

  it("does not suppress when trail is complete and no blockers remain", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      }),
    ).toBe(false);
  });

  it("suppresses Ready when quality gate is WarnOnly on real mode", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        hostAgentExecutionMode: "real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(true);
  });

  it("suppresses Ready for Working Career simulator finalize (CG-021)", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "career",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      }),
    ).toBe(true);
  });

  it("suppresses Ready on Working Rehearsal door even when structural mode is Real (AS-079)", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      }),
    ).toBe(true);
  });

  it("allows Ready on Working Career door when structural mode is Real and trail is complete", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "career",
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      }),
    ).toBe(false);
  });

  it("blocks finalize for Working Career simulator but not Ready label only (CG-021)", () => {
    const input = {
      workingDesk: true,
      effectiveWorkingCareerRehearsalDoor: "career" as const,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    };

    expect(shouldBlockFinalizeForCareerHonesty(input)).toBe(true);
    expect(shouldSuppressReadyToFinalizeForCareerHonesty(input)).toBe(true);
  });

  it("allows finalize for Working Rehearsal simulator with complete trail (LP-06)", () => {
    const input = {
      workingDesk: true,
      effectiveWorkingCareerRehearsalDoor: "rehearsal" as const,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    };

    expect(shouldBlockFinalizeForCareerHonesty(input)).toBe(false);
    expect(shouldSuppressReadyToFinalizeForCareerHonesty(input)).toBe(true);
  });

  it("suppresses Ready when pre-finalize gate is disabled on Working (LP-18)", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        preCommitGateEnabled: false,
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      }),
    ).toBe(true);
  });
});
