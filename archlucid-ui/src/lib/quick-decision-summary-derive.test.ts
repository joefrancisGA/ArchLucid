import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "./quick-decision-summary-derive";
import {
  buildFindingWireSnapshotsForRunDetail,
  extractQuickDecisionFindingsFromRunDetail,
  findingHasNoSourceEvidence,
  firstRecommendationSentence,
  humanReviewStatusDisplay,
  isQuickDecisionDerivedFromExplanationTraces,
  resolveQuickDecisionFindingsForRunDetail,
  sortQuickDecisionFindings,
} from "./quick-decision-summary-derive";

function baseFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f1",
    title: "Title",
    recommendation: "Do the thing.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...overrides,
  };
}

describe("quick-decision-summary-derive", () => {
  it("firstRecommendationSentence returns first sentence when punctuation present", () => {
    expect(firstRecommendationSentence("Patch Redis. Rotate credentials.")).toBe("Patch Redis.");
    expect(firstRecommendationSentence("Alert now! Then verify.")).toBe("Alert now!");
    expect(firstRecommendationSentence("Question? Next step")).toBe("Question?");
  });

  it("firstRecommendationSentence returns full text when no sentence boundary", () => {
    expect(firstRecommendationSentence("No boundary here")).toBe("No boundary here");
  });

  it("extractQuickDecisionFindingsFromRunDetail preserves order and severity", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "a",
              message: "Low issue",
              reasoningTrace: "Monitor closely.",
              severity: 0,
            },
            {
              findingId: "b",
              message: "Critical issue",
              reasoningTrace: "Block deploy. Fix ACL.",
              severity: 3,
            },
          ],
        },
        {
          findings: [
            {
              findingId: "c",
              category: "Cat only",
              reasoningTrace: "",
              severity: 2,
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted).toHaveLength(3);
    expect(extracted[0]?.findingId).toBe("a");
    expect(extracted[0]?.isMuted).toBe(false);
    expect(extracted[0]?.muteReason).toBeNull();
    expect(extracted[0]?.aiReasoning.wireJson).toContain('"findingId": "a"');
    expect(extracted[1]?.findingId).toBe("b");

    const sorted = sortQuickDecisionFindings(extracted);

    expect(sorted[0]?.findingId).toBe("b");
    expect(sorted[1]?.findingId).toBe("c");
    expect(sorted[2]?.findingId).toBe("a");
  });

  it("extractQuickDecisionFindingsFromRunDetail maps string severity enum names from authority wire", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "error-severity",
              message: "Error-class issue",
              severity: "Error",
            },
            {
              findingId: "warning-severity",
              message: "Warning-class issue",
              severity: "Warning",
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted.find((row) => row.findingId === "error-severity")?.severityValue).toBe(2);
    expect(extracted.find((row) => row.findingId === "warning-severity")?.severityValue).toBe(1);
  });

  it("extractQuickDecisionFindingsFromRunDetail maps confidenceLevel, evaluation score, and evidenceRefs count", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "ev1",
              message: "Leak",
              reasoningTrace: "Check.",
              severity: 2,
              confidenceLevel: "low",
              evaluationConfidenceScore: 33,
              evidenceRefs: ["r1", "r2", ""],
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.confidenceLevel).toBe("Low");
    expect(extracted[0]?.evaluationConfidenceScore).toBe(33);
    expect(extracted[0]?.evidenceRefCount).toBe(2);
    expect(extracted[0]?.evidenceRefSnippets).toEqual(["r1", "r2"]);
  });

  it("extractQuickDecisionFindingsFromRunDetail maps owner and human-review-status fields", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "owned-1",
              message: "Needs an owner",
              severity: 1,
              assignedToUserId: " reviewer@example.com ",
              humanReviewStatus: 2,
            },
            {
              findingId: "unowned-1",
              message: "No owner set",
              severity: 1,
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted[0]?.assignedToUserId).toBe("reviewer@example.com");
    expect(extracted[0]?.humanReviewStatus).toBe(2);
    expect(extracted[1]?.assignedToUserId).toBeNull();
    expect(extracted[1]?.humanReviewStatus).toBeNull();
  });

  it("extractQuickDecisionFindingsFromRunDetail maps insight-density fields", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "dense-1",
              message: "Subnet isolation gap",
              severity: 2,
              insightDensityScore: 81,
              whyThisIsNotGeneric: "Names a specific peering rule.",
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted[0]?.insightDensityScore).toBe(81);
    expect(extracted[0]?.whyThisIsNotGeneric).toBe("Names a specific peering rule.");
  });

  it("resolveQuickDecisionFindingsForRunDetail merges explainability trace rows onto extracted findings", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "x",
              message: "Wire only",
              reasoningTrace: "",
              severity: 1,
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const summary = {
      explanation: {
        summary: "",
        keyDrivers: [],
        riskImplications: [],
        costImplications: [],
        complianceImplications: [],
        detailedNarrative: "",
        rawText: "",
        structured: null,
        confidence: null,
        provenance: null,
      },
      themeSummaries: [],
      overallAssessment: "",
      riskPosture: "",
      findingCount: 1,
      decisionCount: 0,
      unresolvedIssueCount: 0,
      complianceGapCount: 0,
      findingTraceConfidences: [
        {
          findingId: "x",
          traceCompletenessRatio: 0.5,
          traceConfidenceLabel: "Partial coverage",
          confidenceLevel: "High",
          evidenceRefCount: 2,
        },
      ],
    } as RunExplanationSummary;

    const resolved = resolveQuickDecisionFindingsForRunDetail(detail, summary);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.findingId).toBe("x");
    expect(resolved[0]?.confidenceLevel).toBe("High");
    expect(resolved[0]?.traceConfidenceLabel).toBe("Partial coverage");
    expect(resolved[0]?.evidenceRefCount).toBe(2);
  });

  it("buildFindingWireSnapshotsForRunDetail maps ids to wire snapshots", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "x",
              message: "Hello",
              reasoningTrace: "Step one.\nStep two.",
              evaluationConfidenceScore: 42,
              severity: 1,
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const snaps = buildFindingWireSnapshotsForRunDetail(detail, null);

    expect(snaps.x).toBeDefined();
    expect(snaps.x?.reasoningTrace).toContain("Step one");
    expect(snaps.x?.wireJson).toContain("evaluationConfidenceScore");
  });

  it("extractQuickDecisionFindingsFromRunDetail skips rows without findingId or id", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [{ findingId: "", message: "x" }] }],
    } as unknown as RunDetail;

    expect(extractQuickDecisionFindingsFromRunDetail(detail)).toHaveLength(0);
  });

  it("extractQuickDecisionFindingsFromRunDetail accepts legacy id when findingId missing", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [{ id: "fid-1", message: "Hello", severity: 2 }] }],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.findingId).toBe("fid-1");
  });

  it("extractQuickDecisionFindingsFromRunDetail maps isMuted and muteReason from wire", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "m1",
              message: "Muted issue",
              reasoningTrace: "Later.",
              severity: 1,
              isMuted: true,
              muteReason: "  noise  ",
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.isMuted).toBe(true);
    expect(extracted[0]?.muteReason).toBe("noise");
  });

  it("resolveQuickDecisionFindingsForRunDetail falls back to explanation trace rows when detail findings missing", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [] }],
    } as unknown as RunDetail;

    const summary = {
      explanation: {
        summary: "",
        keyDrivers: [],
        riskImplications: [],
        costImplications: [],
        complianceImplications: [],
        detailedNarrative: "",
        rawText: "",
        structured: null,
        confidence: null,
        provenance: null,
      },
      themeSummaries: [],
      overallAssessment: "",
      riskPosture: "",
      findingCount: 1,
      decisionCount: 0,
      unresolvedIssueCount: 0,
      complianceGapCount: 0,
      findingTraceConfidences: [
        {
          findingId: "f-a",
          traceCompletenessRatio: 1,
          traceConfidenceLabel: "High",
          findingTitle: "Title A",
          confidenceLevel: "Medium",
        },
      ],
    } as RunExplanationSummary;

    const resolved = resolveQuickDecisionFindingsForRunDetail(detail, summary);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.findingId).toBe("f-a");
    expect(resolved[0]?.isMuted).toBe(false);
    expect(resolved[0]?.confidenceLevel).toBe("Medium");
    expect(resolved[0]?.traceConfidenceLabel).toBe("High");

    const snaps = buildFindingWireSnapshotsForRunDetail(detail, summary);

    expect(snaps["f-a"]).toBeDefined();
    expect(snaps["f-a"]?.reasoningTrace).toBe("High");
  });

  it("isQuickDecisionDerivedFromExplanationTraces is true only when agent results are empty but traces exist", () => {
    const detailWithResults = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [{ findingId: "x", message: "m", reasoningTrace: "t", severity: 1 }] }],
    } as unknown as RunDetail;

    expect(isQuickDecisionDerivedFromExplanationTraces(detailWithResults, null)).toBe(false);

    const emptyResults = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [] }],
    } as unknown as RunDetail;

    const summary = {
      findingTraceConfidences: [{ findingId: "f-a", traceConfidenceLabel: "High" }],
    } as RunExplanationSummary;

    expect(isQuickDecisionDerivedFromExplanationTraces(emptyResults, summary)).toBe(true);
    expect(isQuickDecisionDerivedFromExplanationTraces(emptyResults, null)).toBe(false);
  });

  describe("humanReviewStatusDisplay", () => {
    it("maps each known FindingHumanReviewStatus value to a label and status-tag kind", () => {
      expect(humanReviewStatusDisplay(1)).toEqual({ label: "Pending review", statusKind: "needs-attention" });
      expect(humanReviewStatusDisplay(2)).toEqual({ label: "Approved", statusKind: "approved" });
      expect(humanReviewStatusDisplay(3)).toEqual({ label: "Rejected", statusKind: "blocked" });
      expect(humanReviewStatusDisplay(4)).toEqual({ label: "Overridden", statusKind: "in-progress" });
    });

    it("returns null for NotRequired (0), null, undefined, and unrecognized values", () => {
      expect(humanReviewStatusDisplay(0)).toBeNull();
      expect(humanReviewStatusDisplay(null)).toBeNull();
      expect(humanReviewStatusDisplay(undefined)).toBeNull();
      expect(humanReviewStatusDisplay(99)).toBeNull();
    });
  });

  describe("findingHasNoSourceEvidence", () => {
    it("is true when a finding has no evidence refs, snippets, or policy-rule citation", () => {
      expect(findingHasNoSourceEvidence(baseFinding())).toBe(true);
    });

    it("is false when evidenceRefCount is positive", () => {
      expect(findingHasNoSourceEvidence(baseFinding({ evidenceRefCount: 1 }))).toBe(false);
    });

    it("is false when evidenceRefSnippets is non-empty", () => {
      expect(findingHasNoSourceEvidence(baseFinding({ evidenceRefSnippets: ["snippet"] }))).toBe(false);
    });

    it("is false when a policyRuleId citation is present", () => {
      expect(findingHasNoSourceEvidence(baseFinding({ policyRuleId: "rule-1" }))).toBe(false);
    });
  });
});
