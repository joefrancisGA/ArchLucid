import { describe, expect, it } from "vitest";

import {
  tryVerdictTierFromRiskPosture,
  verdictKindLabel,
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

  it("preserves missing and unexpected stored kind labels", () => {
    expect(verdictKindLabel(undefined)).toBe("Verdict kind was not stored.");
    expect(verdictKindLabel("FutureKind" as never)).toBe("FutureKind");
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

  it("returns null tier when risk posture was not stored", () => {
    expect(tryVerdictTierFromRiskPosture("")).toBeNull();
    expect(tryVerdictTierFromRiskPosture(null)).toBeNull();
    expect(tryVerdictTierFromRiskPosture("Critical hold required")).toBe("Hold");
  });

  it("does not map unrecognized posture text to Remediate", () => {
    expect(tryVerdictTierFromRiskPosture("Needs executive steering committee review")).toBeNull();
  });
});
