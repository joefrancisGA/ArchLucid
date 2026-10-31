import { describe, expect, it } from "vitest";

import { FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION } from "@/lib/findings/finding-semantic-support-band-export";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import {
  buildGovernanceFindingsItsmJsonExportDocument,
  buildQuickDecisionFindingsCsv,
  buildRunFindingsItsmJsonExportDocument,
} from "@/lib/runs/run-findings-itsm-export";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

describe("buildRunFindingsItsmJsonExportDocument", () => {
  it("emits stable work-item documents for each finding", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        policyRuleId: "rule-1",
        trustLabel: "DeterministicRule",
        trustLabelReason: "Matched egress policy.",
      },
    ];

    const document = buildRunFindingsItsmJsonExportDocument(
      "run-a",
      findings,
      "https://demo.example.org",
    );

    expect(document.schema).toBe("archlucid.findings-export.v1");
    expect(document.runId).toBe("run-a");
    expect(document.findingCount).toBe(1);
    expect(document.workItems[0]?.schema).toBe("archlucid.work-item.v1");
    expect(document.workItems[0]?.findingId).toBe("f1");
    expect(document.workItems[0]?.severity).toBe("Error");
    expect(document.workItems[0]?.links.inspect).toContain("/findings/f1/evidence-trace");
    expect(document.workItems[0]?.trustLabel).toBe("DeterministicRule");
    expect(document.workItems[0]?.trustLabelReason).toBe("Matched egress policy.");
  });

  it("includes semantic support band stamp and per-finding band fields (AS-071)", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        semanticSupportBand: "Unsupported",
        semanticSupportBandScorerVersion: FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
      },
    ];

    const document = buildRunFindingsItsmJsonExportDocument(
      "run-a",
      findings,
      "https://demo.example.org",
    );

    expect(document.semanticSupportBandStamp?.scorerVersion).toBe(
      FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
    );
    expect(document.semanticSupportBandStamp?.unsupported).toBe(1);
    expect(document.workItems[0]?.semanticSupportBand).toBe("Unsupported");
    expect(document.workItems[0]?.semanticSupportBandScorerVersion).toBe(
      FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
    );
  });

  it("uses overlay as099 scorer version on stamp and CSV when present (LY-018)", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        semanticSupportBand: "Supported",
        semanticSupportBandScorerVersion: "as099-llm-finalize-v1",
      },
    ];

    const document = buildRunFindingsItsmJsonExportDocument(
      "run-a",
      findings,
      "https://demo.example.org",
    );

    expect(document.semanticSupportBandStamp?.scorerVersion).toBe("as099-llm-finalize-v1");
    expect(document.workItems[0]?.semanticSupportBandScorerVersion).toBe("as099-llm-finalize-v1");

    const csv = buildQuickDecisionFindingsCsv("run-a", findings);
    expect(csv).toContain("as099-llm-finalize-v1");
  });

  it("omits checklist coverage rows and records omitted count", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "decision",
        title: "Decision finding",
        recommendation: "Fix it.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: "DecisionGradeFinding",
      },
      {
        findingId: "checklist",
        title: "Checklist finding",
        recommendation: "Review hygiene.",
        severityValue: 1,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "Advisory",
        classification: "ChecklistCoverage",
      },
    ];

    const document = buildRunFindingsItsmJsonExportDocument(
      "run-a",
      findings,
      "https://demo.example.org",
    );

    expect(document.findingCount).toBe(1);
    expect(document.omittedChecklistCoverageCount).toBe(1);
    expect(document.workItems[0]?.findingId).toBe("decision");
  });
});

describe("buildQuickDecisionFindingsCsv", () => {
  it("distinguishes absent and empty ITSM linkage cells (P-07)", () => {
    const csvAbsent = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
    ]);

    expect(csvAbsent).toContain("ITSM linkage was not stored.");

    const csvEmpty = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f2",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        itsmLinkedTicketsSummary: "",
      },
    ]);

    expect(csvEmpty).toContain("ITSM linkage was stored empty.");
  });

  it("writes explicit absence copy for omitted finding titles (P-08)", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f-null-title",
        title: null as unknown as string,
        recommendation: "Fix it.",
        severityValue: 1,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
    ]);

    expect(csv).toContain("Finding title was not stored.");
  });

  it("writes explicit absence copy for omitted finding fields", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [{
      findingId: "f-missing",
      title: "Missing fields",
      recommendation: "",
      severityValue: 1,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "PolicyViolation",
      classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    }]);

    expect(csv).toContain("Recommended action was stored empty.");
    expect(csv).toContain("Policy rule id was not stored.");
    expect(csv).toContain("Trust label was not stored");
    expect(csv).toContain("Trust label reason was not stored");
    expect(csv).toContain("Semantic support band was not stored");
    expect(csv).toContain("Semantic support band scorer version was not stored");
  });

  it("exports scorer version when the band was stored empty but version was present", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f-band-empty",
        title: "Gap",
        recommendation: "Fix.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        semanticSupportBand: "",
        semanticSupportBandScorerVersion: "as099-llm-finalize-v1",
      } as QuickDecisionFinding,
    ]);

    expect(csv).toContain("Semantic support band was stored empty.");
    expect(csv).toContain("as099-llm-finalize-v1");
    expect(csv).not.toContain("Semantic support band scorer version was not stored");
  });

  it("exports only decision-grade findings rows", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        confidenceLevel: "Low",
        trustLabel: "DeterministicRule",
        trustLabelReason: "Matched egress policy.",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
      {
        findingId: "checklist",
        title: "Generic hygiene",
        recommendation: "Review.",
        severityValue: 1,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "Advisory",
        classification: "ChecklistCoverage",
      },
    ];

    const csv = buildQuickDecisionFindingsCsv("run-a", findings);

    expect(csv).toContain("f1");
    expect(csv).toContain("Open port");
    expect(csv).toContain("TrustLabel");
    expect(csv).toContain("DeterministicRule");
    expect(csv).not.toContain("checklist");
    expect(csv).toContain("Checklist coverage rows omitted from this file: 1");
    expect(csv).toContain("No unclassified classification rows were omitted.");
    expect(csv.split("\n")).toHaveLength(4);
  });

  it("states when no checklist coverage rows were omitted", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f1",
        title: "Open port",
        recommendation: "Close the port.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
    ]);

    expect(csv.startsWith("No checklist coverage rows were omitted.")).toBe(true);
    expect(csv.split("\n")[1]).toBe("No unclassified classification rows were omitted.");
  });

  it("quotes CSV cells that contain carriage returns", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f1",
        title: "Row break\rhere",
        recommendation: "Fix it.",
        severityValue: 1,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
    ]);

    expect(csv).toContain('"Row break\rhere"');
  });

  it("does not label default human review when status was omitted on the wire (P-03)", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f-no-review",
        title: "Gap",
        recommendation: "Fix.",
        severityValue: 2,
        severityStored: true,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        humanReviewStatus: 0,
        humanReviewStatusStored: false,
      },
    ]);

    expect(csv).toContain("Human review status was not stored");
    expect(csv).not.toContain("No human review required");
  });

  it("does not label default severity Info when severity was omitted on the wire (P-02)", () => {
    const csv = buildQuickDecisionFindingsCsv("run-a", [
      {
        findingId: "f-no-severity",
        title: "Gap",
        recommendation: "Fix.",
        severityValue: 0,
        severityStored: false,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
      },
    ]);

    expect(csv).toContain("Severity was not stored");
    expect(csv).not.toContain(",Info,");
  });
});

describe("buildGovernanceFindingsItsmJsonExportDocument", () => {
  it("skips decision rows and exports finding work items", () => {
    const document = buildGovernanceFindingsItsmJsonExportDocument(
      [
        {
          runId: "run-z",
          findingId: "find-z",
          title: "Title z",
          severity: "High",
          recommended: "Fix it.",
          status: "Open",
          recordKind: "finding",
          trustLabel: "DeterministicRule",
          trustLabelReason: "Rule matched.",
        },
        {
          runId: "run-z",
          findingId: "decision-1",
          title: "Accepted risk",
          severity: "Low",
          recommended: "Monitor.",
          status: "Accepted",
          recordKind: "decision",
        },
      ],
      "https://demo.example.org",
    );

    expect(document.schema).toBe("archlucid.governance-findings-export.v1");
    expect(document.findingCount).toBe(1);
    expect(document.workItems[0]?.findingId).toBe("find-z");
    expect(document.workItems[0]?.trustLabel).toBe("DeterministicRule");
  });
});
