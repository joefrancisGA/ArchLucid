import { describe, expect, it } from "vitest";

import {
  architectOutcomeMetricPresentation,
  buildRemediationFactoryExecutiveMetricPresentations,
  formatArchitectOutcomeDeltaValue,
  REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY,
  remediationFactoryCountMetricPresentation,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";

describe("remediation-factory-metric-presentation", () => {
  it("renders a missing count as not measured", () => {
    expect(remediationFactoryCountMetricPresentation({ value: null, scopeNote: "scope" })).toEqual(
      expect.objectContaining({
        displayValue: "Not measured",
        scopeNote: "Not measured",
        state: "notMeasured",
      }),
    );
  });

  it("keeps the rule version out of the visible tile helpers", () => {
    const metrics: RemediationFactoryMetrics = {
      openFindings: 3,
      riskWeightedOpen: 1.2,
      criticalExposureCount: 1,
      createdThisWeek: 2,
      remediatedThisWeek: 1,
      netBurn: 1,
      recurrenceCount: 0,
      patternCoverageExactMatchPercent: 50,
      automationPercent: 25,
      verificationFailureCount: 0,
      exceptionsActive: 1,
      exceptionsExpiringSoon: 0,
      exceptionsExpired: 0,
      businessBlockedCount: 0,
      averageAgeDays: 4.5,
      topControlIds: [],
      topPatternKeys: [],
    };
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });
    const openFindings = tiles.filter((tile) => tile.label === "Open findings");

    expect(openFindings).toHaveLength(1);
    expect(openFindings[0]?.presentation.scopeNote).toBe("SecureNow findings that are still open.");
    expect(tiles.map((tile) => tile.presentation.scopeNote).join(" ")).not.toContain("IE15-priority-v1");
    expect(tiles.map((tile) => tile.presentation.scopeNote).join(" ")).not.toContain("factory metrics API");
    expect(tiles.map((tile) => tile.presentation.scopeNote).join(" ")).not.toContain("may differ");
    expect(tiles.map((tile) => tile.hint ?? "").join(" ")).not.toContain("may differ");
    expect(REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY).toContain("IE15-priority-v1");
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
