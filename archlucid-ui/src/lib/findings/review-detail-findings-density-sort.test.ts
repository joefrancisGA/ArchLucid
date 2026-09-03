import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  filterReviewDetailFindingsHideGeneric,
  sortReviewDetailFindingsBySignal,
} from "@/lib/findings/review-detail-findings-density-sort";

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-1",
    findingOrder: 1,
    severityValue: 3,
    title: "Finding",
    severity: "High",
    status: "Open",
    insightDensityScore: 0.5,
    ...overrides,
  } as QuickDecisionFinding;
}

describe("review-detail-findings-density-sort (PT-07)", () => {
  it("hides generic rows when hideGeneric is true", () => {
    const rows = [
      finding({ findingId: "generic", insightDensityScore: 20 }),
      finding({ findingId: "signal", insightDensityScore: 80 }),
    ];

    const filtered = filterReviewDetailFindingsHideGeneric(rows, true);

    expect(filtered.map((row) => row.findingId)).toEqual(["signal"]);
  });

  it("sorts by insight density then severity", () => {
    const rows = [
      finding({ findingId: "low", insightDensityScore: 0.2, severityValue: 4, findingOrder: 2 }),
      finding({ findingId: "high", insightDensityScore: 0.9, severityValue: 2, findingOrder: 1 }),
    ];

    const sorted = sortReviewDetailFindingsBySignal(rows);

    expect(sorted.map((row) => row.findingId)).toEqual(["high", "low"]);
  });
});
