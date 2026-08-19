import { describe, expect, it } from "vitest";

import {
  computeRoiSummaryPeriodMetrics,
  deriveRoiSummaryConfidence,
  deriveRoiSummaryDataNeeds,
  formatRoiSummaryWindowTitle,
  interpretRoiSummaryMeaning,
} from "@/lib/roi-summary-sponsor-presentation";

const emptySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

function periodInput(overrides: {
  totalRunsCommitted?: number;
  severity?: { critical: number; high: number; medium: number };
  blocks?: number;
}) {
  return {
    report: {
      fromUtc: "2026-06-08T00:00:00.000Z",
      toUtc: "2026-07-08T00:00:00.000Z",
      totalRunsCommitted: overrides.totalRunsCommitted ?? 0,
      findingsBySeverity: {
        ...emptySeverity,
        critical: overrides.severity?.critical ?? 0,
        high: overrides.severity?.high ?? 0,
        medium: overrides.severity?.medium ?? 0,
      },
    },
    blocks: { count: overrides.blocks ?? 0, exact: true },
  };
}

describe("formatRoiSummaryWindowTitle", () => {
  it("formats rolling 30-day sponsor labels without UTC jargon", () => {
    expect(
      formatRoiSummaryWindowTitle("rolling30", "2026-06-08T00:00:00.000Z", "2026-07-08T00:00:00.000Z"),
    ).toBe("Rolling 30 days: Jun 8, 2026 – Jul 7, 2026");
  });
});

describe("deriveRoiSummaryConfidence", () => {
  it("returns insufficient when no inputs exist", () => {
    expect(deriveRoiSummaryConfidence(periodInput({})).level).toBe("insufficient");
  });

  it("returns good when committed reviews and findings produce hours", () => {
    expect(
      deriveRoiSummaryConfidence(
        periodInput({ totalRunsCommitted: 2, severity: { critical: 1, high: 0, medium: 0 } }),
      ).level,
    ).toBe("good");
  });
});

describe("deriveRoiSummaryDataNeeds", () => {
  it("marks hourly cost as met with a positive rate", () => {
    const needs = deriveRoiSummaryDataNeeds(periodInput({}), 150);

    expect(needs.find((item) => item.label.includes("Loaded hourly cost"))?.met).toBe(true);
  });
});

describe("computeRoiSummaryPeriodMetrics", () => {
  it("computes hours and dollar value from severity weights", () => {
    const metrics = computeRoiSummaryPeriodMetrics(
      periodInput({ totalRunsCommitted: 1, severity: { critical: 1, high: 0, medium: 0 } }),
      150,
    );

    expect(metrics.hours).toBe(8);
    expect(metrics.showUsdEstimate).toBe(true);
    expect(metrics.usdEstimate).toBe(1200);
  });
});

describe("interpretRoiSummaryMeaning", () => {
  it("explains the zero-data case constructively", () => {
    const metrics = computeRoiSummaryPeriodMetrics(periodInput({}), 150);

    expect(interpretRoiSummaryMeaning(metrics, 150)).toMatch(/finalized reviews/i);
  });
});
