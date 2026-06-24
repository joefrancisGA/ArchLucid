import { describe, expect, it } from "vitest";

import {
  buildGovernanceFindingsItsmJsonExportDocument,
  buildRunFindingsItsmJsonExportDocument,
} from "./run-findings-itsm-export";
import type { QuickDecisionFinding } from "./quick-decision-summary-derive";

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
    expect(document.workItems[0]?.links.inspect).toContain("/findings/f1/inspect");
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
  });
});
