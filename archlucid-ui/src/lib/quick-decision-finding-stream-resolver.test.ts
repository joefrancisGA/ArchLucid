import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import { describe, expect, it } from "vitest";

import {
  buyerSummaryOmitsAgentFindings,
  extractAgentQuickDecisionFindingsFromRunDetail,
  extractSealedQuickDecisionFindingsFromRunDetail,
} from "@/lib/quick-decision-finding-stream-resolver";
import {
  isQuickDecisionDerivedFromExplanationTraces,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-finding-merge-and-sort";
import { formatFindingStreamDualCountLine } from "@/lib/finding-stream-product-of-record-copy";

describe("quick-decision-finding-stream-resolver (LP-05)", () => {
  it("resolveQuickDecisionFindingsForRunDetail does not synthesize rows from explanation traces when agent findings are empty", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [] }],
    } as unknown as RunDetail;

    const summary = {
      findingTraceConfidences: [
        {
          findingId: "f-a",
          traceConfidenceLabel: "High",
          findingTitle: "Title A",
          confidenceLevel: "Medium",
        },
      ],
    } as RunExplanationSummary;

    const resolved = resolveQuickDecisionFindingsForRunDetail(detail, summary);

    expect(resolved).toHaveLength(0);
    expect(isQuickDecisionDerivedFromExplanationTraces(detail, summary)).toBe(false);
  });

  it("tags sealed snapshot rows separately from agent results", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingsSnapshot: {
        findings: [
          {
            findingId: "sealed-1",
            title: "Sealed row",
            rationale: "Because",
            severity: "High",
            enforcementTier: "PolicyViolation",
          },
        ],
      },
      results: [
        {
          resultId: "agent-1",
          taskId: "topology",
          findings: [
            {
              findingId: "agent-1",
              message: "Agent row",
              reasoningTrace: "Trace",
              severity: 2,
              enforcementTier: "PolicyViolation",
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const sealed = extractSealedQuickDecisionFindingsFromRunDetail(detail);
    const agent = extractAgentQuickDecisionFindingsFromRunDetail(detail);

    expect(sealed).toHaveLength(1);
    expect(sealed[0]?.streamBand).toBe("sealed");
    expect(agent).toHaveLength(1);
    expect(agent[0]?.streamBand).toBe("agent");
    expect(formatFindingStreamDualCountLine(sealed.length, agent.length)).toContain("Deterministic findings (sealed): 1");
  });

  it("buyerSummaryOmitsAgentFindings is true when agents succeeded but only sealed summaries hydrate the payload", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingSummaries: [{ findingId: "sealed-1", title: "Sealed only" }],
      agentExecutionOutcomes: [{ agentType: "Topology", outcome: "Succeeded" }],
      results: [
        {
          resultId: "buyer-summary-r1",
          taskId: "buyer-summary",
          findings: [{ findingId: "sealed-1", message: "Sealed only", severity: 2 }],
        },
      ],
    } as unknown as RunDetail;

    const agent = extractAgentQuickDecisionFindingsFromRunDetail(detail);

    expect(agent).toHaveLength(0);
    expect(buyerSummaryOmitsAgentFindings(detail, agent)).toBe(true);
  });
});
