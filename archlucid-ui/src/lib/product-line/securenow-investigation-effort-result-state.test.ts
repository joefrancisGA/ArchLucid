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

  it("calculates ROI when after-product hours are zero", () => {
    expect(
      resolveSecureNowInvestigationEffortResultState({
        baselineHours: "3",
        afterHours: "0",
        annualInvestigations: "10",
        hourlyRate: "80",
        annualCost: "5000",
      }),
    ).toEqual({
      kind: "calculated",
      headline: "Entered inputs. Not a customer result.",
      gross: 2400,
      net: -2600,
      ratio: -2600 / 5000,
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
