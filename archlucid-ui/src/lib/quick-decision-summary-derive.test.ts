import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import { describe, expect, it } from "vitest";

import {
  buildFindingWireSnapshotsForRunDetail,
  extractQuickDecisionFindingsFromRunDetail,
  firstRecommendationSentence,
  resolveQuickDecisionFindingsForRunDetail,
  sortQuickDecisionFindings,
} from "./quick-decision-summary-derive";

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
          recommendedActions: ["Do thing"],
          confidenceLevel: "Medium",
        },
      ],
    } as RunExplanationSummary;

    const resolved = resolveQuickDecisionFindingsForRunDetail(detail, summary);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.findingId).toBe("f-a");
    expect(resolved[0]?.isMuted).toBe(false);

    const snaps = buildFindingWireSnapshotsForRunDetail(detail, summary);

    expect(snaps["f-a"]).toBeDefined();
    expect(snaps["f-a"]?.reasoningTrace).toContain("Do thing");
  });
});
