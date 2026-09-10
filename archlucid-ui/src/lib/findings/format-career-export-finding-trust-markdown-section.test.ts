import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { formatCareerExportFindingTrustMarkdownSection } from "./format-career-export-finding-trust-markdown-section";

describe("formatCareerExportFindingTrustMarkdownSection (FC-36)", () => {
  it("includes trust label and reason for exportable findings", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "finding-1",
        title: "Open egress",
        recommendation: "Restrict egress.",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        confidenceLevel: "High",
        policyRuleId: "rule-1",
        classification: "DecisionGradeFinding",
        trustLabel: "DeterministicRule",
        trustLabelReason: "Policy rule matched.",
      },
    ];

    const markdown = formatCareerExportFindingTrustMarkdownSection(findings);

    expect(markdown).toContain("## Finding trust labels");
    expect(markdown).toContain("finding-1");
    expect(markdown).toContain("DeterministicRule");
    expect(markdown).toContain("Policy rule matched.");
  });
});
