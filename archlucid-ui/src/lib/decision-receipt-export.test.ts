import { describe, expect, it } from "vitest";

import {
  buildDecisionReceiptDocument,
  DECISION_RECEIPT_COST_ESTIMATE_LABEL,
  DECISION_RECEIPT_SCHEMA_VERSION,
  isExportableDecisionVerdict,
  resolveDecisionReceiptExportBlockedReason,
} from "./decision-receipt-export";
import { HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";

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

  it("includes asserted vs inferred transparency trail on export (CD-07)", () => {
    const receipt = buildDecisionReceiptDocument({
      source: "committed-run",
      runId: "run-1",
      verdict: {
        kind: "Feasible",
        summary: "Proceed with constraints.",
        transparencyTrail: {
          asserted: [{ key: "region", value: "eastus" }],
          inferred: [{ key: "throughput", value: "high", confidence: 0.6 }],
          skipped: [{ questionKey: "must-dr", tier: "Must" }],
        },
      },
    });

    expect(receipt.transparencyTrail?.asserted).toHaveLength(1);
    expect(receipt.transparencyTrail?.inferred).toHaveLength(1);
    expect(receipt.transparencyTrail?.skipped).toHaveLength(1);
  });

  it("blocks decision receipt export when hard infeasible lacks citation (FC-30)", () => {
    const blockedReason = resolveDecisionReceiptExportBlockedReason({
      source: "committed-run",
      runId: "run-1",
      verdict: {
        kind: "HardInfeasible",
        summary: "Required controls cannot be satisfied.",
      },
    });

    expect(blockedReason).toBe(HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON);
  });
});
