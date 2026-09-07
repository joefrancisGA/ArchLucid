import { describe, expect, it } from "vitest";

import { shouldSuppressReadyToFinalizeForCareerHonesty } from "@/lib/runs/run-pipeline-finalize-blocked-honesty";
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

  it("does not suppress when trail is unavailable on list summaries", () => {
    expect(
      shouldSuppressReadyToFinalizeForCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        hostAgentExecutionMode: "real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(true);
  });
});
