import { describe, expect, it } from "vitest";

import {
  listCompareAssumptionDiffItems,
  summarizeCompareProvenanceDelta,
} from "@/lib/compare/compare-provenance-delta-summary";
import type { DiffItem } from "@/types/authority";

describe("compare-provenance-delta-summary (WA-09)", () => {
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
      },
      [],
    );

    expect(summary.showBand).toBe(true);
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
