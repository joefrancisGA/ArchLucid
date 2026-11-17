import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  formatItsmExportScopeLabel,
  isChecklistCoverageFindingForExport,
  isDecisionGradeFindingForExport,
  isUnclassifiedFindingForExport,
  partitionFindingsForItsmExport,
} from "@/lib/findings/decision-grade-finding-export-filter";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...overrides,
  };
}

describe("decision-grade-finding-export-filter", () => {
  it("treats null classification as not decision-grade for export (P-01)", () => {
    expect(isDecisionGradeFindingForExport(finding({ classification: null }))).toBe(false);
    expect(isUnclassifiedFindingForExport(finding({ classification: null }))).toBe(true);
    expect(isChecklistCoverageFindingForExport(finding({ classification: null }))).toBe(false);
  });

  it("omits checklist and unclassified rows from export partition", () => {
    const partition = partitionFindingsForItsmExport([
      finding({ findingId: "decision", classification: FINDING_CLASSIFICATION_DECISION_GRADE }),
      finding({ findingId: "checklist", classification: "ChecklistCoverage" }),
      finding({ findingId: "legacy", classification: null }),
      finding({ findingId: "weird", classification: "LegacyGate" }),
    ]);

    expect(partition.exportableFindings.map((row) => row.findingId)).toEqual(["decision"]);
    expect(partition.omittedChecklistCount).toBe(1);
    expect(partition.omittedUnclassifiedCount).toBe(2);
  });

  it("formats checklist and unclassified omission disclosure (P-02)", () => {
    expect(formatItsmExportScopeLabel(2, 1, 3)).toBe(
      "Exporting 2 decision-grade findings (1 checklist coverage omitted; 3 unclassified (not decision-grade)).",
    );
  });
});
