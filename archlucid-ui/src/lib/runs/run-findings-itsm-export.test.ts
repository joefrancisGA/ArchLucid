import { describe, expect, it } from "vitest";

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
    expect(document.workItems[0]?.severity).toBe("High");
    expect(document.workItems[0]?.links.inspect).toContain("/findings/f1/evidence-trace");
    expect(document.workItems[0]?.trustLabel).toBe("DeterministicRule");
    expect(document.workItems[0]?.trustLabelReason).toBe("Matched egress policy.");
  });
});

describe("buildQuickDecisionFindingsCsv", () => {
  it("exports only the passed findings rows", () => {
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
      },
    ];

    const csv = buildQuickDecisionFindingsCsv("run-a", findings);

    expect(csv).toContain("f1");
    expect(csv).toContain("Open port");
    expect(csv.split("\n")).toHaveLength(2);
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
      },
    ]);

    expect(csv).toContain('"Row break\rhere"');
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
