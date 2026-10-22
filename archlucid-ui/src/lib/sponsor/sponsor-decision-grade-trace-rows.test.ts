import { describe, expect, it } from "vitest";

import {
  decisionGradeSponsorTraceRows,
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  isChecklistCoverageTraceRow,
} from "@/lib/sponsor/sponsor-decision-grade-trace-rows";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

function traceRow(
  findingId: string,
  classification?: FindingTraceConfidenceDto["classification"],
): FindingTraceConfidenceDto {
  return {
    findingId,
    traceConfidenceLabel: "High",
    classification,
  };
}

describe("sponsor-decision-grade-trace-rows", () => {
  it("isChecklistCoverageTraceRow matches checklist classification only", () => {
    expect(isChecklistCoverageTraceRow(traceRow("a", FINDING_CLASSIFICATION_CHECKLIST_COVERAGE))).toBe(true);
    expect(isChecklistCoverageTraceRow(traceRow("a", "DecisionGradeFinding"))).toBe(false);
    expect(isChecklistCoverageTraceRow(traceRow("a", null))).toBe(false);
    expect(isChecklistCoverageTraceRow(traceRow("a"))).toBe(false);
  });

  it("decisionGradeSponsorTraceRows drops checklist coverage and blank ids", () => {
    const rows = decisionGradeSponsorTraceRows([
      traceRow("decision-grade", "DecisionGradeFinding"),
      traceRow("checklist", FINDING_CLASSIFICATION_CHECKLIST_COVERAGE),
      traceRow("legacy-no-class"),
      traceRow("  ", "DecisionGradeFinding"),
    ]);

    expect(rows.map((r) => r.findingId)).toEqual(["decision-grade", "legacy-no-class"]);
  });
});
