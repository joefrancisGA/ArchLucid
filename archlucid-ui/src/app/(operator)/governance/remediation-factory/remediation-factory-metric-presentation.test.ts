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

  it("omits pattern-exact-match drill-through hint when percent is not measured", () => {
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics: {} as RemediationFactoryMetrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "pattern-exact-match")?.hint).toBeUndefined();
  });

  it("renders non-finite architect outcome deltas as not measured", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: Number.NaN,
        denominator: 12,
        populationLabel: "Compared snapshots",
      }),
    ).toEqual(
      expect.objectContaining({
        displayValue: "Not measured",
        state: "notMeasured",
      }),
    );
  });

  it("renders non-finite architect outcome denominators as not measured in scope notes", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: 2,
        denominator: Number.NaN,
        populationLabel: "Compared snapshots",
      }),
    ).toEqual(
      expect.objectContaining({
        displayValue: "+2",
        scopeNote: "Not measured",
        state: "measured",
      }),
    );
  });
  it("renders negative architect outcome denominators as not measured in scope notes", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: 2,
        denominator: -3,
        populationLabel: "Compared snapshots",
      }),
    ).toEqual(
      expect.objectContaining({
        displayValue: "+2",
        scopeNote: "Not measured",
        state: "measured",
      }),
    );
  });
  it("renders fractional architect outcome denominators as not measured in scope notes", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: 1,
        denominator: 2.5,
        populationLabel: "Compared snapshots",
      }),
    ).toEqual(
      expect.objectContaining({
        displayValue: "+1",
        scopeNote: "Not measured",
        state: "measured",
      }),
    );
  });  it("renders negative risk-weighted open as not measured", () => {
    const metrics = { riskWeightedOpen: -1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "risk-weighted-open")?.presentation).toEqual(
      expect.objectContaining({
        displayValue: "Not measured",
        state: "notMeasured",
      }),
    );
  });
  it("renders non-finite critical exposure counts as not measured", () => {
    const metrics = { criticalExposureCount: Number.NaN } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });
    const presentation = tiles.find((tile) => tile.key === "critical-exposure")?.presentation;

    expect(presentation?.displayValue).toBe("Not measured");
    expect(presentation?.state).toBe("notMeasured");
    expect(tiles.find((tile) => tile.key === "critical-exposure")?.hint).toBeUndefined();
  });


  it("renders fractional critical exposure counts as not measured", () => {
    const metrics = { criticalExposureCount: 1.9 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "critical-exposure")?.presentation).toEqual(
      expect.objectContaining({
        displayValue: "Not measured",
        state: "notMeasured",
      }),
    );
  });


  it("omits fractional critical exposure in metric tiles", () => {
    const metrics = { criticalExposureCount: 1.9 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBeNull();
  });

  it("omits fractional net burn in metric tiles", () => {
    const metrics = { netBurn: 1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
  });

  it("renders fractional net burn as not measured in the executive table", () => {
    const metrics = { netBurn: 1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "net-burn")?.presentation.displayValue).toBe("Not measured");
  });
  it("keeps signed net burn values in the executive table", () => {
    const metrics = { netBurn: -3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "net-burn")?.presentation.displayValue).toBe("-3");
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

  it("omits scopeLine on executive metric tiles when metrics are unloaded", () => {
    const metrics = { openFindings: 3, automationPercent: 10 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.every((tile) => tile.scopeLine === undefined)).toBe(true);
  });
  it("omits windowLine on executive metric tiles when metrics are unloaded", () => {
    const metrics = {
      openFindings: 3,
      criticalExposureCount: 1,
      recurrenceCount: 2,
      createdThisWeek: 1,
      remediatedThisWeek: 2,
      netBurn: -1,
      patternCoverageExactMatchPercent: 10,
      automationPercent: 20,
      exceptionsActive: 4,
    } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);
    const tileIdsWithWindowLine = [
      "open-findings-queue",
      "critical-exposure",
      "recurrence",
      "net-burn",
      "pattern-exact",
      "automation",
      "exceptions-active",
    ];

    for (const tileId of tileIdsWithWindowLine) {
      expect(tiles.find((tile) => tile.id === tileId)?.windowLine).toBeUndefined();
    }
  });
  it("omits ruleLine on open-findings-factory when metrics are unloaded", () => {
    const metrics = { openFindings: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.ruleLine).toBeUndefined();
  });


  it("omits open-findings-factory compare footnote when open findings count is not returned", () => {
    const metrics = { automationPercent: 10 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.valueFootnote).toBeNull();
  });




  it("uses middle dot in risk-weighted ruleLine when value is measured", () => {
    const metrics = { riskWeightedOpen: 1.2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.ruleLine).toContain("· weighted sum");
    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.ruleLine).not.toContain("? weighted sum");
  });

  it("omits open-findings-queue windowLine when open findings count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.windowLine).toBeUndefined();
  });


  it("omits automation windowLine when percent is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "automation")?.windowLine).toBeUndefined();
  });

  it("omits critical-exposure windowLine when count is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "critical-exposure")?.windowLine).toBeUndefined();
  });

  it("omits recurrence windowLine when count is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "recurrence")?.windowLine).toBeUndefined();
  });

  it("omits net-burn windowLine when net burn is not returned", () => {
    const metrics = { createdThisWeek: 1, remediatedThisWeek: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "net-burn")?.windowLine).toBeUndefined();
  });

  it("omits exceptions-active windowLine when count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "exceptions-active")?.windowLine).toBeUndefined();
  });


  it("omits open-findings-queue scopeLine when open findings count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.scopeLine).toBeUndefined();
  });

  it("omits exceptions-active scopeLine when count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.scopeLine).toBeUndefined();
  });

  it("omits pattern-exact scopeLine when percent is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.scopeLine).toBeUndefined();
  });

  it("omits automation scopeLine when percent is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.scopeLine).toBeUndefined();
  });


  it("omits critical-exposure scopeLine when count is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.scopeLine).toBeUndefined();
  });

  it("omits recurrence scopeLine when count is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.scopeLine).toBeUndefined();
  });

  it("omits net-burn scopeLine when net burn is not returned", () => {
    const metrics = { createdThisWeek: 1, remediatedThisWeek: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.scopeLine).toBeUndefined();
  });

  it("omits avg-age scopeLine when value is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "avg-age")?.scopeLine).toBeUndefined();
  });


  it("keeps open-findings-queue href when count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.href).toBeDefined();
  });

  it("keeps critical-exposure scopeLine when count is zero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.scopeLine).toBeDefined();
  });

  it("keeps net-burn scopeLine when net burn is zero", () => {
    const metrics = { netBurn: 0, createdThisWeek: 0, remediatedThisWeek: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.scopeLine).toBeDefined();
  });

  it("keeps pattern-exact scopeLine when percent is zero", () => {
    const metrics = { patternCoverageExactMatchPercent: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.scopeLine).toBeDefined();
  });

  it("keeps automation scopeLine when percent is zero", () => {
    const metrics = { automationPercent: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.scopeLine).toBeDefined();
  });

  it("keeps recurrence scopeLine when count is zero", () => {
    const metrics = { recurrenceCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.scopeLine).toBeDefined();
  });

  it("keeps exceptions-active scopeLine when count is zero", () => {
    const metrics = { exceptionsActive: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.scopeLine).toBeDefined();
  });

  it("keeps open-findings-queue scopeLine when count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.scopeLine).toBeDefined();
  });

  it("keeps critical-exposure href when count is zero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.href).toBeDefined();
  });

  it("keeps avg-age scopeLine when value is zero", () => {
    const metrics = { averageAgeDays: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "avg-age")?.scopeLine).toBeDefined();
  });


  it("keeps open-findings-queue windowLine when count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.windowLine).toBeDefined();
  });

  it("keeps exceptions-active windowLine when count is zero", () => {
    const metrics = { exceptionsActive: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.windowLine).toBeDefined();
  });

  it("keeps recurrence windowLine when count is zero", () => {
    const metrics = { recurrenceCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.windowLine).toBeDefined();
  });

  it("keeps critical-exposure windowLine when count is zero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.windowLine).toBeDefined();
  });

  it("keeps net-burn windowLine when net burn is zero", () => {
    const metrics = { netBurn: 0, createdThisWeek: 0, remediatedThisWeek: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.windowLine).toBeDefined();
  });


  it("keeps avg-age scopeLine when value is negative zero", () => {
    const metrics = { averageAgeDays: -0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "avg-age")?.scopeLine).toBeDefined();
    expect(tiles.find((tile) => tile.id === "avg-age")?.value).toBe("0.0");
  });

  it("keeps pattern-exact value when percent is negative zero", () => {
    const metrics = { patternCoverageExactMatchPercent: -0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.value).toBe("0%");
  });

  it("keeps automation value when percent is negative zero", () => {
    const metrics = { automationPercent: -0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.value).toBe("0%");
  });

  it("keeps pattern-exact-match drill-through hint when percent is measuredZero", () => {
    const metrics = { patternCoverageExactMatchPercent: 0 } as RemediationFactoryMetrics;
    const table = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(table.find((tile) => tile.key === "pattern-exact-match")?.hint).toContain("Pattern keys");
  });
  it("omits automation table hint when percent is measuredZero", () => {
    const metrics = { automationPercent: 0 } as RemediationFactoryMetrics;
    const table = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(table.find((tile) => tile.key === "automation")?.presentation.state).toBe("measuredZero");
    expect(table.find((tile) => tile.key === "automation")?.hint).toBeUndefined();
  });
  it("keeps risk-weighted-open ruleLine when value is zero", () => {
    const metrics = { riskWeightedOpen: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.ruleLine).toContain("weighted sum");
  });

  it("keeps net-burn valueFootnote when net burn and weekly counts are zero", () => {
    const metrics = { netBurn: 0, createdThisWeek: 0, remediatedThisWeek: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toContain("Created 0");
  });
  it("keeps open-findings-factory scopeLine when count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.scopeLine).toBeDefined();
  });

  it("keeps critical-exposure valueFootnote when count is zero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toContain("No critical-or-error findings");
  });
  it("keeps pattern-exact windowLine when percent is zero", () => {
    const metrics = { patternCoverageExactMatchPercent: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.windowLine).toBeDefined();
  });

  it("keeps automation windowLine when percent is zero", () => {
    const metrics = { automationPercent: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.windowLine).toBeDefined();
  });

  it("keeps risk-weighted-open scopeLine when value is zero", () => {
    const metrics = { riskWeightedOpen: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.scopeLine).toBeDefined();
  });

  it("shows critical-exposure table hint when count is measuredZero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const table = buildRemediationFactoryExecutiveMetricPresentations({ metrics, openFindingsHref: "/security/findings" });

    expect(table.find((tile) => tile.key === "critical-exposure")?.hint).toContain("No critical-or-error");
  });  it("omits open-findings-queue href when count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.href).toBeUndefined();
  });
  it("omits risk-weighted-open scopeLine when value is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.scopeLine).toBeUndefined();
  });
  it("omits open-findings-factory scopeLine when open findings count is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.scopeLine).toBeUndefined();
  });

  it("omits critical-exposure href when count is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "critical-exposure")?.href).toBeUndefined();
  });
  it("omits pattern-exact windowLine when percent is not returned", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "pattern-exact")?.windowLine).toBeUndefined();
  });
  it("omits ruleLine on risk-weighted-open when value is not returned", () => {
    const metrics = { openFindings: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "risk-weighted-open")?.ruleLine).toBeUndefined();
  });

  it("renders automation table presentation as not measured when percent is NaN", () => {
    const metrics = { automationPercent: Number.NaN } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "automation")?.presentation.state).toBe("notMeasured");
  });

  it("omits net-burn weekly footnote when only netBurn is returned", () => {
    const metrics = { netBurn: 2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });
  it("omits ruleLine on open-findings-factory when open findings count is not returned", () => {
    const metrics = { automationPercent: 10 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.ruleLine).toBeUndefined();
  });

  it("omits pattern-exact-match drill-through hint when pattern percent is NaN", () => {
    const metrics = { patternCoverageExactMatchPercent: Number.NaN } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "pattern-exact-match")?.hint).toBeUndefined();
  });

  it("renders automation percent zero on the tile", () => {
    const metrics = { automationPercent: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.value).toBe("0%");
  });

  it("renders measured zero on recurrence tile", () => {
    const metrics = { recurrenceCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "recurrence")?.valueFootnote).toBeUndefined();
  });
  it("keeps open-findings-factory compare footnote when open findings count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.valueFootnote).toContain(
      "compare to queue",
    );
  });

  it("shows critical-exposure table hint when API sends count as a numeric string zero", () => {
    const metrics = { criticalExposureCount: "0" as unknown as number } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "critical-exposure")?.presentation.displayValue).toBe("0");
    expect(tiles.find((tile) => tile.key === "critical-exposure")?.hint).toContain(
      "No critical-or-error findings",
    );
  });

  it("omits net-burn weekly footnote when weekly counts are present but net burn is not returned", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: 1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });
  it("omits open-findings-factory footnote when metrics are unloaded", () => {
    const metrics = { openFindings: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.valueFootnote).toBeNull();
  });

  it("omits critical-exposure footnote when metrics are unloaded even if count is zero", () => {
    const metrics = { criticalExposureCount: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toBeNull();
  });

  it("omits exceptions-active footnote when metrics are unloaded even if a metrics object is present", () => {
    const metrics = { exceptionsActive: 3, exceptionsExpiringSoon: 2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, false);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toBeNull();
  });


  it("omits exceptions-active footnote when active count is not returned even if expiring-soon is zero", () => {
    const metrics = { exceptionsExpiringSoon: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toBeNull();
  });

  it("keeps exceptions-active expiring footnote when active and expiring counts are zero", () => {
    const metrics = { exceptionsActive: 0, exceptionsExpiringSoon: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toContain("0 expiring soon");
  });

  it("omits critical-exposure table hint when count is fractional", () => {
    const metrics = { criticalExposureCount: 0.4 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });
    const row = tiles.find((tile) => tile.key === "critical-exposure");

    expect(row?.presentation.state).toBe("notMeasured");
    expect(row?.hint).toBeUndefined();
  });

  it("open-findings-queue tile never carries a valueFootnote", () => {
    const metrics = { automationPercent: 5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-queue")?.valueFootnote).toBeUndefined();
  });
  it("omits exceptions-active footnote when expiring-soon count is not returned", () => {
    const metrics = { exceptionsActive: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toBeNull();
  });


  it("omits net-burn footnote when weekly counts are fractional", () => {
    const metrics = { createdThisWeek: 1.2, remediatedThisWeek: 5, netBurn: 4 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("omits net-burn footnote when net burn is fractional but weekly counts are integers", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: 3, netBurn: 1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("omits net-burn footnote when weekly created is negative", () => {
    const metrics = { createdThisWeek: -1, remediatedThisWeek: 2, netBurn: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("omits critical-exposure zero footnote when count is negative", () => {
    const metrics = { criticalExposureCount: -1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toBeNull();
  });

  it("shows critical-exposure zero footnote when count is negative zero", () => {
    const metrics = { criticalExposureCount: -0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toContain("No critical-or-error findings");
  });

  it("omits critical-exposure zero footnote when count is fractional", () => {
    const metrics = { criticalExposureCount: 0.4 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBeNull();
    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toBeNull();
  });
  it("shows critical-exposure zero footnote when API sends count as a numeric string", () => {
    const metrics = { criticalExposureCount: "0" as unknown as number } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "critical-exposure")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "critical-exposure")?.valueFootnote).toContain(
      "No critical-or-error findings",
    );
  });

  it("renders net-burn tile value when only netBurn is returned", () => {
    const metrics = { netBurn: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBe("3");
  });

  it("renders automation percent above 100 in the executive table", () => {
    const metrics = { automationPercent: 150 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "automation")?.presentation.displayValue).toBe("150%");
  });

  it("omits exceptions-active table hint when expiring-soon is Infinity", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: Number.POSITIVE_INFINITY } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });

  it("omits exceptions-active table hint when expiring-soon is NaN", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: Number.NaN } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });

  it("omits net-burn footnote when weekly created is fractional and net burn is zero", () => {
    const metrics = { createdThisWeek: 1.1, remediatedThisWeek: 0, netBurn: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("omits net-burn footnote when weekly counts disagree with net burn", () => {
    const metrics = { createdThisWeek: 5, remediatedThisWeek: 3, netBurn: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.value).toBe("0");
    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("omits net-burn footnote when weekly remediated is negative", () => {
    const metrics = { createdThisWeek: 2, remediatedThisWeek: -1, netBurn: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
  });

  it("renders negative average age as not measured in the executive table", () => {
    const metrics = { averageAgeDays: -1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "average-age")?.presentation.state).toBe("notMeasured");
  });

  it("formats average age to one decimal in metric tiles", () => {
    const metrics = { averageAgeDays: 1.55 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "avg-age")?.value).toBe("1.6");
  });

  it("omits fractional open findings in metric tiles", () => {
    const metrics = { openFindings: 2.3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.value).toBeNull();
  });

  it("omits exceptions footnote when expiring-soon count is fractional", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: 1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toBeNull();
  });
  it("omits net-burn footnote when weekly counts are not returned", () => {
    const metrics = { netBurn: 2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "net-burn")?.valueFootnote).toBeNull();
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


  it("omits exceptions-active table hint when expiring-soon count is fractional", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: 1.5 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });

  it("omits exceptions-active table hint when expiring-soon count is negative", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: -2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });

  it("omits open findings drill-through href when count is fractional", () => {
    const metrics = { openFindings: 2.2 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "open-findings")?.presentation.href).toBeUndefined();
  });

  it("omits exceptions footnote when expiring-soon count is negative", () => {
    const metrics = { exceptionsActive: 2, exceptionsExpiringSoon: -1 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "exceptions-active")?.valueFootnote).toBeNull();
  });

  it("omits fractional recurrence counts in metric tiles", () => {
    const metrics = { recurrenceCount: 0.8 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "recurrence")?.value).toBeNull();
  });

  it("omits exceptions-active table hint when active count is not returned even if expiring-soon is zero", () => {
    const metrics = { exceptionsExpiringSoon: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.presentation.state).toBe("notMeasured");
    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });

  it("keeps ruleLine on open-findings-factory when open findings count is zero", () => {
    const metrics = { openFindings: 0 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricTiles(metrics, true);

    expect(tiles.find((tile) => tile.id === "open-findings-factory")?.ruleLine).toContain("IE15-priority-v1");
  });
  it("omits exceptions-active table hint when expiring-soon count is not returned", () => {
    const metrics = { exceptionsActive: 3 } as RemediationFactoryMetrics;
    const tiles = buildRemediationFactoryExecutiveMetricPresentations({
      metrics,
      openFindingsHref: "/security/findings",
    });

    expect(tiles.find((tile) => tile.key === "exceptions-active")?.hint).toBeUndefined();
  });
  it("formats architect outcome deltas with no-change state", () => {
    expect(formatArchitectOutcomeDeltaValue(0)).toBe("No change");
    expect(formatArchitectOutcomeDeltaValue(3)).toBe("+3");
    expect(formatArchitectOutcomeDeltaValue(-2)).toBe("-2");
  });
  it("treats string denominator one point zero as measured architect scope", () => {
    expect(
      architectOutcomeMetricPresentation({
        value: 1,
        denominator: "1.0" as unknown as number,
        populationLabel: "Compared snapshots",
      }).scopeNote,
    ).toContain("1 resources");
  });

  it("omits net-burn table hint when net burn is measuredZero", () => {
    const table = buildRemediationFactoryExecutiveMetricPresentations({
      metrics: { netBurn: 0, createdThisWeek: 0, remediatedThisWeek: 0 } as RemediationFactoryMetrics,
      openFindingsHref: "/security/findings",
    });

    expect(table.find((row) => row.key === "net-burn")?.hint).toBeUndefined();
  });

  it("automation tile never carries a valueFootnote when percent is measuredZero", () => {
    const tiles = buildRemediationFactoryExecutiveMetricTiles({ automationPercent: 0 } as RemediationFactoryMetrics, true);

    expect(tiles.find((tile) => tile.id === "automation")?.valueFootnote).toBeUndefined();
  });

  it("pattern-exact tile never carries a valueFootnote when percent is measuredZero", () => {
    const tiles = buildRemediationFactoryExecutiveMetricTiles({ patternCoverageExactMatchPercent: 0 } as RemediationFactoryMetrics, true);

    expect(tiles.find((tile) => tile.id === "pattern-exact")?.valueFootnote).toBeUndefined();
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
