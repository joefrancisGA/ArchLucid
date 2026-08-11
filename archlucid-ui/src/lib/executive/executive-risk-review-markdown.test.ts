import { describe, expect, it } from "vitest";

import { buildExecutiveRiskReviewMarkdown, executiveRiskReviewMarkdownFilename } from "./executive-risk-review-markdown";

import type { RunExplanationSummary } from "@/types/explanation";

function stubSummary(overrides: Partial<RunExplanationSummary> = {}): RunExplanationSummary {
  return {
    explanation: {
      rawText: "",
      structured: null,
      confidence: null,
      provenance: null,
      summary: "",
      keyDrivers: [],
      riskImplications: [],
      costImplications: [],
      complianceImplications: [],
      detailedNarrative: "",
      findingTraceConfidences: null,
    },
    themeSummaries: [],
    overallAssessment: "Proceed with architecture changes under listed conditions.",
    riskPosture: "Moderate — monitored PHI minimization gaps.",
    findingCount: 2,
    decisionCount: 1,
    unresolvedIssueCount: 0,
    complianceGapCount: 0,
    ...overrides,
  };
}

describe("buildExecutiveRiskReviewMarkdown", () => {
  it("includes headline, posture, and findings table rows", () => {
    const md = buildExecutiveRiskReviewMarkdown("run-abc", "Claims Intake", stubSummary(), [
      { findingId: "f1", title: "PHI risk", severity: "High", recommended: "Encrypt payloads" },
    ]);

    expect(md).toContain("# Executive summary — Claims Intake");
    expect(md).toContain("`run-abc`");
    expect(md).toContain("Moderate — monitored PHI minimization gaps.");
    expect(md).toContain("| High | PHI risk | Encrypt payloads |");
  });

  it("sanitizes table cells with pipes and newlines", () => {
    const md = buildExecutiveRiskReviewMarkdown("r", "H", stubSummary(), [
      { findingId: "f", title: "A|B\nC", severity: "Low", recommended: "X" },
    ]);

    expect(md).toContain("| A/B C |");
    expect(md).not.toContain("|A|B");
  });
});

describe("executiveRiskReviewMarkdownFilename", () => {
  it("sanitizes run id for filesystem use", () => {
    expect(executiveRiskReviewMarkdownFilename("claims/intake")).toBe("executive-summary-claims-intake.md");
  });
});
