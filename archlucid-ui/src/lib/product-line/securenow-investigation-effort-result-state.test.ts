import { describe, expect, it } from "vitest";

import { resolveSecureNowInvestigationEffortResultState } from "./securenow-investigation-effort-result-state";

describe("resolveSecureNowInvestigationEffortResultState", () => {
  it("explains incomplete inputs", () => {
    expect(
      resolveSecureNowInvestigationEffortResultState({
        baselineHours: "",
        afterHours: "2",
        annualInvestigations: "10",
        hourlyRate: "80",
        annualCost: "5000",
      }),
    ).toEqual({
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: "Still needed: Baseline hours (B).",
      incompleteReason: "missing_fields",
    });
  });

  it("rejects after hours above baseline", () => {
    expect(
      resolveSecureNowInvestigationEffortResultState({
        baselineHours: "2",
        afterHours: "3",
        annualInvestigations: "10",
        hourlyRate: "80",
        annualCost: "5000",
      }),
    ).toEqual({
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: "After-product hours must not exceed baseline hours for a positive capacity delta.",
      incompleteReason: "invalid_after_hours",
    });
  });
});
