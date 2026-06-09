import { describe, expect, it } from "vitest";

import {
  verdictTierFromFeasibilityKind,
  verdictTierFromRiskPosture,
  verdictTierLabel,
  verdictTierTone,
} from "@/lib/verdict-taxonomy";

describe("verdict-taxonomy", () => {
  it("maps feasibility kinds to unified tiers", () => {
    expect(verdictTierFromFeasibilityKind("Feasible")).toBe("Proceed");
    expect(verdictTierFromFeasibilityKind("SoftInfeasible")).toBe("Remediate");
    expect(verdictTierFromFeasibilityKind("HardInfeasible")).toBe("Hold");
  });

  it("returns tier labels and tones", () => {
    expect(verdictTierLabel("Proceed")).toBe("Proceed");
    expect(verdictTierTone("Proceed")).toBe("success");
    expect(verdictTierTone("Remediate")).toBe("warning");
    expect(verdictTierTone("Hold")).toBe("danger");
  });

  it("maps risk posture strings to tiers", () => {
    expect(verdictTierFromRiskPosture("Approved with monitoring")).toBe("Proceed");
    expect(verdictTierFromRiskPosture("Elevated residual risk")).toBe("Remediate");
    expect(verdictTierFromRiskPosture("Critical hold required")).toBe("Hold");
  });
});
