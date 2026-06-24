import { describe, expect, it } from "vitest";

import {
  decisionGradeExecutiveTraceRows,
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  isChecklistCoverageTraceRow,
} from "@/lib/executive-decision-grade-trace-rows";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

function traceRow(
  findingId: string,
  classification?: number | null,
): FindingTraceConfidenceDto {
  return {
    findingId,
    traceConfidenceLabel: "High",
    classification,
  };
}

describe("executive-decision-grade-trace-rows", () => {
  it("isChecklistCoverageTraceRow matches checklist classification only", () => {
    expect(isChecklistCoverageTraceRow(traceRow("a", FINDING_CLASSIFICATION_CHECKLIST_COVERAGE))).toBe(true);
    expect(isChecklistCoverageTraceRow(traceRow("a", 0))).toBe(false);
    expect(isChecklistCoverageTraceRow(traceRow("a", null))).toBe(false);
    expect(isChecklistCoverageTraceRow(traceRow("a"))).toBe(false);
  });

  it("decisionGradeExecutiveTraceRows drops checklist coverage and blank ids", () => {
    const rows = decisionGradeExecutiveTraceRows([
      traceRow("decision-grade", 0),
      traceRow("checklist", FINDING_CLASSIFICATION_CHECKLIST_COVERAGE),
      traceRow("legacy-no-class"),
      traceRow("  ", 0),
    ]);

    expect(rows.map((r) => r.findingId)).toEqual(["decision-grade", "legacy-no-class"]);
  });
});
