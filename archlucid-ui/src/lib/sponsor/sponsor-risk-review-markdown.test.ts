import { describe, expect, it } from "vitest";

import { buildSponsorRiskReviewMarkdown, executiveRiskReviewMarkdownFilename } from "./sponsor-risk-review-markdown";

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

describe("buildSponsorRiskReviewMarkdown", () => {
  it("includes headline, posture, and findings table rows", () => {
    const md = buildSponsorRiskReviewMarkdown("run-abc", "Claims Intake", stubSummary(), [
      { findingId: "f1", title: "PHI risk", severity: "High", recommended: "Encrypt payloads" },
    ]);

    expect(md).toContain("# Sponsor report — Claims Intake");
    expect(md).toContain("`run-abc`");
    expect(md).toContain("Moderate — monitored PHI minimization gaps.");
    expect(md).toContain("| High | PHI risk | Encrypt payloads |");
  });

  it("sanitizes table cells with pipes and newlines", () => {
    const md = buildSponsorRiskReviewMarkdown("r", "H", stubSummary(), [
      { findingId: "f", title: "A|B\nC", severity: "Low", recommended: "X" },
    ]);

    expect(md).toContain("| A/B C |");
    expect(md).not.toContain("|A|B");
  });

  it("labels missing sponsor decision data without adding a generic action", () => {
    const md = buildSponsorRiskReviewMarkdown(
      "r",
      "H",
      stubSummary({ riskPosture: "", overallAssessment: "", themeSummaries: [], explanation: {
        ...stubSummary().explanation!,
        keyDrivers: [],
        riskImplications: [],
      } }),
      [],
    );

    expect(md).toContain("Risk posture was not stored");
    expect(md).toContain("Final decision was not stored");
    expect(md).toContain("No sponsor action was stored on this review.");
    expect(md).not.toContain("align owners");
  });

  it("omits residual posture duplication and labels empty finding cells", () => {
    const md = buildSponsorRiskReviewMarkdown(
      "r",
      "H",
      stubSummary({ riskPosture: "" }),
      [{ findingId: "f", title: "", severity: "", recommended: "" }],
    );

    expect(md.match(/Risk posture was not stored/g)).toHaveLength(1);
    expect(md).not.toContain("Residual risk posture: .");
    expect(md).toContain(
      "| Severity was not stored | Finding title was not stored | No recommended action recorded for this finding. |",
    );
  });

  it("reports a missing unresolved issue count while preserving zero", () => {
    const missing = buildSponsorRiskReviewMarkdown(
      "r",
      "H",
      stubSummary({ unresolvedIssueCount: null }),
      [],
    );
    const zero = buildSponsorRiskReviewMarkdown("r", "H", stubSummary({ unresolvedIssueCount: 0 }), []);

    expect(missing).toContain("Unresolved issue count was not stored.");
    expect(zero).toContain("0 unresolved review issues.");
    expect(zero).not.toContain("Unresolved issue count was not stored.");
  });

  it("reports a missing compliance gap count while preserving zero and positives", () => {
    const missing = buildSponsorRiskReviewMarkdown("r", "H", stubSummary({ complianceGapCount: null }), []);
    const zero = buildSponsorRiskReviewMarkdown("r", "H", stubSummary({ complianceGapCount: 0 }), []);
    const positive = buildSponsorRiskReviewMarkdown("r", "H", stubSummary({ complianceGapCount: 2 }), []);

    expect(missing).toContain("Compliance gap count was not stored.");
    expect(zero).not.toContain("Compliance gap count was not stored.");
    expect(positive).toContain("2 compliance gaps");
  });
});

describe("executiveRiskReviewMarkdownFilename", () => {
  it("sanitizes run id for filesystem use", () => {
    expect(executiveRiskReviewMarkdownFilename("claims/intake")).toBe("sponsor-report-claims-intake.md");
  });
});
