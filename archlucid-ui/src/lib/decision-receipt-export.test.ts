import { describe, expect, it } from "vitest";

import {
  buildDecisionReceiptDocument,
  DECISION_RECEIPT_COST_ESTIMATE_LABEL,
  DECISION_RECEIPT_SCHEMA_VERSION,
  isExportableDecisionVerdict,
} from "./decision-receipt-export";

describe("decisionReceiptExport", () => {
  it("marks soft and hard infeasible verdicts exportable", () => {
    expect(isExportableDecisionVerdict("SoftInfeasible")).toBe(true);
    expect(isExportableDecisionVerdict("HardInfeasible")).toBe(true);
    expect(isExportableDecisionVerdict("Feasible")).toBe(false);
  });

  it("builds a versioned receipt with SAQ-011 cost estimate label", () => {
    const receipt = buildDecisionReceiptDocument({
      source: "draft-admission",
      draftId: "draft-1",
      redirectReason: "Missing actor set.",
      verdict: {
        kind: "SoftInfeasible",
        summary: "Actor set is required before admission.",
      },
      freeTextIntent: "Build a workflow.",
      businessOutcome: "Faster triage.",
    });

    expect(receipt.schemaVersion).toBe(DECISION_RECEIPT_SCHEMA_VERSION);
    expect(receipt.costStory.label).toBe(DECISION_RECEIPT_COST_ESTIMATE_LABEL);
    expect(receipt.verdict.kind).toBe("SoftInfeasible");
    expect(receipt.intake?.freeTextIntent).toBe("Build a workflow.");
  });
});
