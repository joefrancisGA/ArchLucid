import { describe, expect, it } from "vitest";

import {
  deriveSkippedActorEngineTypes,
  formatInsightDensityMeasurementFloorBlockedReason,
  formatInsightDensityMeasurementFloorPresentation,
  INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES,
} from "@/lib/quality/insight-density-measurement-floor";

describe("insight-density-measurement-floor (PC-01 / DX-15)", () => {
  it("pins harness and catalog counts to Decisioning constants", () => {
    expect(INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES).toBe(16);

    const presentation = formatInsightDensityMeasurementFloorPresentation(23);

    expect(presentation.catalogEngineCount).toBe(39);
    expect(presentation.harnessEngineCount).toBe(16);
    expect(presentation.measuredThisRunEngineCount).toBe(23);
  });

  it("names partial coverage without claiming full catalog measurement", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(10);

    expect(presentation.line).toContain("10 of 39");
    expect(presentation.line).toContain("analytically incomplete");
    expect(presentation.meetsCareerExportFloor).toBe(false);
    expect(presentation.line).not.toMatch(/all engines (were )?scored/i);
  });

  it("blocks career export when measured count is unknown", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(null);

    expect(presentation.measuredThisRunEngineCount).toBeNull();
    expect(presentation.line).toContain("No engine coverage measured");
    expect(presentation.line).not.toContain("run");
    expect(presentation.line).not.toContain("CI");
    expect(presentation.line).not.toContain("golden corpus harness");
    expect(presentation.meetsCareerExportFloor).toBe(false);
    expect(formatInsightDensityMeasurementFloorBlockedReason(null)).toContain("not been measured");
  });

  it("blocks career export below the harness floor", () => {
    expect(formatInsightDensityMeasurementFloorBlockedReason(10)).toContain("measurement floor");
    expect(formatInsightDensityMeasurementFloorBlockedReason(16)).toBeNull();
  });

  it("names skipped actor engines on IaC-only graphs when analysis is complete", () => {
    expect(deriveSkippedActorEngineTypes(0, true)).toEqual([
      "external-exposure",
      "trust-boundary",
      "privileged-access",
    ]);

    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      actorNodeCount: 0,
      analysisStagesComplete: true,
    });

    expect(presentation.skippedActorEngineTypes).toEqual([
      "external-exposure",
      "trust-boundary",
      "privileged-access",
    ]);
    expect(presentation.line).toContain("external-exposure");
    expect(presentation.line).toContain("no Actor nodes");
  });

  it("does not name skipped actor engines when the graph has actors", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      actorNodeCount: 2,
      analysisStagesComplete: true,
    });

    expect(presentation.skippedActorEngineTypes).toEqual([]);
    expect(presentation.line).not.toContain("external-exposure");
  });

  it("appends judge cap honesty when provided", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(16, {
      judgeSkippedByCap: 3,
    });

    expect(presentation.judgeSkippedByCap).toBe(3);
    expect(presentation.line).toContain("skipped 3 findings by per-snapshot cap");
  });
});
