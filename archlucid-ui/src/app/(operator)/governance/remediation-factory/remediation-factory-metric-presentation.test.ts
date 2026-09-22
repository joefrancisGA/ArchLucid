import { describe, expect, it } from "vitest";

import {
  architectOutcomeMetricPresentation,
  formatArchitectOutcomeDeltaValue,
  remediationFactoryCountMetricPresentation,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation";

describe("remediation-factory-metric-presentation", () => {
  it("renders not measured as em dash with reason", () => {
    expect(remediationFactoryCountMetricPresentation({ value: null, scopeNote: "scope" })).toEqual(
      expect.objectContaining({
        displayValue: " — ",
        state: "notMeasured",
      }),
    );
  });

  it("formats architect outcome deltas with no-change state", () => {
    expect(formatArchitectOutcomeDeltaValue(0)).toBe("No change");
    expect(formatArchitectOutcomeDeltaValue(3)).toBe("+3");
    expect(formatArchitectOutcomeDeltaValue(-2)).toBe("-2");
  });

  it("includes comparison population in outcome scope notes", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: 2,
        denominator: 12,
        populationLabel: "Compared snapshots",
      }).scopeNote,
    ).toContain("12 resources");
  });
});
