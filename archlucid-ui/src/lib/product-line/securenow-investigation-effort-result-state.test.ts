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
      reason: "Enter all five inputs with positive numbers. Empty or invalid fields stay out of ROI.",
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
      }).reason,
    ).toContain("After-product hours must not exceed baseline hours");
  });
});
