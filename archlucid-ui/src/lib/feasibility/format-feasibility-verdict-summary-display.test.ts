import { describe, expect, it } from "vitest";

import {
  FEASIBILITY_VERDICT_SUMMARY_NOT_STORED,
  FEASIBILITY_VERDICT_SUMMARY_STORED_EMPTY,
  formatFeasibilityVerdictSummaryForDisplay,
} from "@/lib/feasibility/format-feasibility-verdict-summary-display";

describe("format-feasibility-verdict-summary-display (P-10)", () => {
  it("distinguishes omitted and empty verdict summaries", () => {
    expect(formatFeasibilityVerdictSummaryForDisplay(null)).toBe(FEASIBILITY_VERDICT_SUMMARY_NOT_STORED);
    expect(formatFeasibilityVerdictSummaryForDisplay("   ")).toBe(FEASIBILITY_VERDICT_SUMMARY_STORED_EMPTY);
    expect(formatFeasibilityVerdictSummaryForDisplay("Ready to proceed")).toBe("Ready to proceed");
  });
});
