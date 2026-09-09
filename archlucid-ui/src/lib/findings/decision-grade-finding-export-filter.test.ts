import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  formatItsmExportScopeLabel,
  isChecklistCoverageFindingForExport,
  isDecisionGradeFindingForExport,
  partitionFindingsForItsmExport,
} from "@/lib/findings/decision-grade-finding-export-filter";

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
  it("treats null classification as decision-grade for export", () => {
    expect(isDecisionGradeFindingForExport(finding({ classification: null }))).toBe(true);
    expect(isChecklistCoverageFindingForExport(finding({ classification: null }))).toBe(false);
  });

  it("omits checklist coverage rows from export partition", () => {
    const partition = partitionFindingsForItsmExport([
      finding({ findingId: "decision", classification: "DecisionGradeFinding" }),
      finding({ findingId: "checklist", classification: "ChecklistCoverage" }),
      finding({ findingId: "legacy", classification: null, enforcementTier: "Advisory" }),
    ]);

    expect(partition.exportableFindings.map((row) => row.findingId)).toEqual(["decision", "legacy"]);
    expect(partition.omittedChecklistCount).toBe(1);
  });

  it("formats checklist omission disclosure", () => {
    expect(formatItsmExportScopeLabel(2, 1)).toBe(
      "Exporting 2 decision-grade findings (1 checklist coverage omitted).",
    );
  });
});
