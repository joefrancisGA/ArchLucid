import { describe, expect, it } from "vitest";

import {
  architectOutcomeMetricPresentation,
  buildRemediationFactoryExecutiveMetricPresentations,
  formatArchitectOutcomeDeltaValue,
  REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY,
  remediationFactoryCountMetricPresentation,
  remediationFactoryPercentMetricPresentation,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation";
import { buildRemediationFactoryExecutiveMetricTiles } from "@/lib/remediation-factory/remediation-factory-metrics-presentation";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";

describe("remediation-factory-metric-presentation", () => {
  it("keeps low API percentages in percentage points", () => {
    expect(remediationFactoryPercentMetricPresentation({ value: 1, scopeNote: "scope" }).displayValue)
      .toBe("1%");

    const metrics = { patternCoverageExactMatchPercent: 0.1, automationPercent: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.value).toBe("0%");
    expect(tiles.find((tile) => tile.id === "automation")?.value).toBe("1%");
  });

  it("renders a missing count as not measured", () => {
    expect(remediationFactoryCountMetricPresentation({ value: null, scopeNote: "scope" })).toEqual(
      expect.objectContaining({
        displayValue: "Not measured",
        scopeNote: "Not measured",
        state: "notMeasured",
      }),
    );
  });



  it("renders percent tiles above 100 on the API points scale without capping", () => {
    const metrics = {
      patternCoverageExactMatchPercent: 150.4,
      automationPercent: 25,
    } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.value).toBe("150%");
  });

  it("omits net-burn footnote when metrics are unloaded even if a metrics object is present", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: 5, netBurn: -3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("does not show positive net burn when metrics are unloaded even if netBurn is present", () => {
    const metrics = { createdThisWeek: 10, remediatedThisWeek: 2, netBurn: 8 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
  });

  it("does not show net burn when metrics are unloaded even if netBurn is present", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: 5, netBurn: -3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
  });

  it("returns null tile values when metrics are not loaded even if a metrics object is present", () => {
    const metrics = { automationPercent: 25, openFindings: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.every((tile) => tile.value === null)).toBe(true);
  });
  it("omits non-finite percent tiles instead of rendering NaN%", () => {
    const metrics = {
      patternCoverageExactMatchPercent: Number.NaN,
      automationPercent: 25,
    } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "automation")?.value).toBe("25%");
  });

  it("shows negative net burn when more findings were remediated than opened", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: 5, netBurn: -3 } as RemediationFactoryMetrics;

    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBe("-3");
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
