import { describe, expect, it } from "vitest";

import {
  formatCompareTransparencyTrailMetric,
  listCompareAssumptionDiffItems,
  summarizeCompareProvenanceDelta,
} from "@/lib/compare/compare-provenance-delta-summary";
import type { DiffItem } from "@/types/authority";

describe("compare-provenance-delta-summary (WA-09)", () => {
  it("labels null trails as Not returned instead of zero", () => {
    expect(formatCompareTransparencyTrailMetric(null, false, "asserted")).toBe("Not returned");
    expect(formatCompareTransparencyTrailMetric(null, true, "asserted")).toBe("Not recorded");
  });

  it("shows the band when skipped MUST counts differ between packages", () => {
    const summary = summarizeCompareProvenanceDelta(
      {
        runId: "run-left",
        label: "Baseline",
        trail: {
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "data-residency", tier: "Must" }],
        },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
      },
      {
        runId: "run-right",
        label: "Updated",
        trail: {
          asserted: [],
          inferred: [],
          skipped: [],
        },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
      },
      [],
    );

    expect(summary.showBand).toBe(true);
  });

  it("shows the band when feasibility verdict kinds differ (FC-34)", () => {
    const summary = summarizeCompareProvenanceDelta(
      {
        runId: "run-left",
        label: "Baseline",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
      },
      {
        runId: "run-right",
        label: "Updated",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "SoftInfeasible",
      },
      [],
    );

    expect(summary.showBand).toBe(true);
    expect(summary.feasibilityVerdictChanged).toBe(true);
  });

  it("filters manifest assumption diffs from legacy compare output", () => {
    const diffs: DiffItem[] = [
      {
        section: "Assumptions",
        key: "multi-region",
        diffKind: "Added",
        beforeValue: null,
        afterValue: "true",
        notes: null,
      },
      {
        section: "Decisions",
        key: "approve",
        diffKind: "Removed",
        beforeValue: "yes",
        afterValue: null,
        notes: null,
      },
    ];

    expect(listCompareAssumptionDiffItems(diffs)).toHaveLength(1);
    expect(listCompareAssumptionDiffItems(diffs)[0]?.key).toBe("multi-region");
  });
});
