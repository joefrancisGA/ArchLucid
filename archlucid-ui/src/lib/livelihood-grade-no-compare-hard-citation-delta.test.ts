import { describe, expect, it } from "vitest";

import { summarizeCompareHardCitationDelta } from "@/lib/livelihood-grade-no-compare-hard-citation-delta";

describe("livelihood-grade-no compare hard citation delta (LN-037)", () => {
  it("surfaces citation count changes between compared runs", () => {
    const summary = summarizeCompareHardCitationDelta(
      {
        runLabel: "Baseline",
        feasibilityVerdictKind: "HardInfeasible",
        hardCitationCount: 0,
      },
      {
        runLabel: "Updated",
        feasibilityVerdictKind: "HardInfeasible",
        hardCitationCount: 2,
      },
    );

    expect(summary.showCitationDelta).toBe(true);
    expect(summary.line).toMatch(/Hard citation delta/);
    expect(summary.line).toMatch(/Uncited hard cannot export/);
  });
});
