import { describe, expect, it } from "vitest";

import {
  buildPlainLanguageQualityBlockSummary,
  buildAgentQualityConcernRows,
  type AgentQualityConcernRow,
} from "@/lib/agent-quality-warnings-presenter";

describe("buildPlainLanguageQualityBlockSummary", () => {
  it("returns null when no rejected rows", () => {
    const rows: AgentQualityConcernRow[] = [
      {
        traceId: "t1",
        agentType: "Topology",
        agentLabel: "Architecture structure",
        status: "warned",
        structuralCompletenessRatio: 0.8,
        semanticScore: 0.6,
        breachedThresholds: [],
      },
    ];

    expect(buildPlainLanguageQualityBlockSummary(rows)).toBeNull();
  });

  it("names rejected agents in plain language", () => {
    const evaluation = {
      recorded: {
        authority: "recorded",
        scores: [
          {
            traceId: "t1",
            agentType: "Critic",
            structuralCompletenessRatio: 0.5,
            qualityWarning: true,
            semantic: { overallSemanticScore: 0.4 },
          },
        ],
        tracesSkippedCount: 0,
        averageStructuralCompletenessRatio: 0.5,
        averageSemanticScore: 0.4,
      },
      advisoryCurrent: {
        authority: "advisoryCurrent",
        scores: [],
        tracesSkippedCount: 0,
        averageStructuralCompletenessRatio: null,
        averageSemanticScore: null,
      },
    };
    const traces = [{ traceId: "t1", qualityRejected: true, qualityWarning: true }];
    const rows = buildAgentQualityConcernRows(evaluation as never, traces as never);

    expect(buildPlainLanguageQualityBlockSummary(rows)).toContain("Critic");
    expect(buildPlainLanguageQualityBlockSummary(rows)).toContain("blocked");
    expect(buildPlainLanguageQualityBlockSummary(rows)).toContain("not an LLM outage");
    expect(buildPlainLanguageQualityBlockSummary(rows)?.toLowerCase()).not.toContain("model failed");
  });
});
