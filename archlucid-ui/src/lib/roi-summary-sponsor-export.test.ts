import { describe, expect, it } from "vitest";

import {
  buildRoiSummaryExportMarkdown,
  computeRoiSummaryPeriodMetrics,
  formatRoiSummaryWindowTitle,
} from "@/lib/roi-summary-sponsor-presentation";

describe("buildRoiSummaryExportMarkdown", () => {
  it("includes rate basis and loaded hourly cost", () => {
    const period = {
      report: {
        fromUtc: "2026-06-08T00:00:00.000Z",
        toUtc: "2026-07-08T00:00:00.000Z",
        totalRunsCommitted: 2,
        findingsBySeverity: { critical: 1, high: 2, medium: 1, low: 0, info: 0 },
      },
      blocks: { count: 1, exact: true },
    };

    const metrics = computeRoiSummaryPeriodMetrics(period, 175);
    const markdown = buildRoiSummaryExportMarkdown({
      windowTitle: formatRoiSummaryWindowTitle("rolling30", period.report.fromUtc, period.report.toUtc),
      metrics,
      hourlyUsd: 175,
      isDefaultRate: false,
    });

    expect(markdown).toMatch(/Rate basis:/i);
    expect(markdown).toMatch(/Loaded hourly cost: \$175/i);
    expect(markdown).toMatch(/Buyer-provided/i);
  });
});
