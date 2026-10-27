import { describe, expect, it } from "vitest";

import {
  buildDecisionReceiptDocument,
  buildDecisionReceiptFilename,
  DECISION_RECEIPT_COST_ESTIMATE_LABEL,
  DECISION_RECEIPT_COST_FIGURES_NOT_STORED,
  DECISION_RECEIPT_DRAFT_ID_NOT_STORED,
  DECISION_RECEIPT_FREE_TEXT_INTENT_NOT_STORED,
  DECISION_RECEIPT_RUN_ID_NOT_STORED,
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
    expect(receipt.costStory.sessionCostUsdEstimate).toBe("Session cost was not stored.");
    expect(receipt.costStory.avoidedHumanArchitectCostUsdEstimate).toBe(
      "Avoided human architect cost was not stored.",
    );
    expect(receipt.verdict.kind).toBe("SoftInfeasible");
    expect(receipt.intake?.freeTextIntent).toBe("Build a workflow.");
    expect(receipt.costStory.narrative).toBe(DECISION_RECEIPT_COST_FIGURES_NOT_STORED);
    expect(receipt.costStory.avoidedCalendarWeeksEstimate).toBe("Avoided calendar time was not stored.");
    expect(JSON.stringify(receipt)).not.toContain("25000");
    expect(JSON.stringify(receipt)).not.toContain("2–4");
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

  it("includes career posture on committed-run receipts (CG-025)", () => {
    const receipt = buildDecisionReceiptDocument({
      source: "committed-run",
      runId: "run-1",
      structuralExecutionMode: "Simulator",
      liveDoor: "rehearsal",
      verdict: {
        kind: "Feasible",
        summary: "Proceed with constraints.",
      },
    });

    expect(receipt.careerPosture?.structuralExecutionMode).toBe("Simulator");
    expect(receipt.careerPosture?.workingCareerRehearsalDoor).toBe("rehearsal");
    expect(receipt.careerPosture?.rehearsalIncomplete).toBe(true);
  });

  it("writes not-stored intake and ids when context omits identifiers (P-01)", () => {
    const receipt = buildDecisionReceiptDocument({
      source: "draft-admission",
      verdict: {
        kind: "SoftInfeasible",
        summary: "Actor set is required before admission.",
      },
    });

    expect(receipt.runId).toBe(DECISION_RECEIPT_RUN_ID_NOT_STORED);
    expect(receipt.draftId).toBe(DECISION_RECEIPT_DRAFT_ID_NOT_STORED);
    expect(receipt.intake.freeTextIntent).toBe(DECISION_RECEIPT_FREE_TEXT_INTENT_NOT_STORED);
    expect(buildDecisionReceiptFilename({ source: "draft-admission", verdict: receipt.verdict })).not.toMatch(
      /archlucid-decision-receipt-decision-/,
    );
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
