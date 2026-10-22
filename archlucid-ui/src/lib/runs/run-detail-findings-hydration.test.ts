import type { RunDetail } from "@/types/authority";
import { describe, expect, it } from "vitest";

import { mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings } from "@/lib/runs/run-detail-findings-hydration";

function buyerSummaryWithoutFindings(): RunDetail {
  return {
    run: {
      runId: "operator-demo-review-e2e",
      projectId: "33333333-3333-3333-3333-333333333333",
      createdUtc: "2026-06-23T04:00:00.000Z",
      goldenManifestId: "f0000001-0000-4000-8000-000000000001",
    },
    executionFlavorBuyerSummary: "Policy-aware demo review.",
  };
}

function operatorDetailWithFindings(): RunDetail {
  return {
    run: {
      runId: "operator-demo-review-e2e",
      projectId: "33333333-3333-3333-3333-333333333333",
      createdUtc: "2026-06-23T04:00:00.000Z",
      goldenManifestId: "f0000001-0000-4000-8000-000000000001",
    },
    results: [
      {
        resultId: "r1",
        taskId: "t1",
        runId: "operator-demo-review-e2e",
        agentType: "Compliance",
        findings: [
          {
            findingId: "demo-finding-1",
            message: "Public SQL endpoint without private link",
            category: "Security",
            severity: "Critical",
            policyRuleId: "sec-base-001",
            reasoningTrace: "Remediate public sql endpoint to satisfy sec-base-001.",
          },
        ],
        confidence: 0.9,
        claims: [],
        evidenceRefs: [],
      },
    ],
  };
}

describe("mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings", () => {
  it("returns buyer summary unchanged when findings are already present", async () => {
    const detail = operatorDetailWithFindings();

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      detail,
    );

    expect(merged).toBe(detail);
  });

  it("synthesizes QuickDecision results from findingSummaries without fat getRunDetail", async () => {
    const buyerSummary: RunDetail = {
      ...buyerSummaryWithoutFindings(),
      findingSummaries: [
        {
          findingId: "demo-finding-1",
          title: "Public SQL endpoint without private link",
          category: "Security",
          severity: "Critical",
          policyRuleId: "sec-base-001",
        },
      ],
    } as RunDetail;

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummary,
    );

    expect(merged.results).toHaveLength(1);
    expect(merged.results?.[0]?.findings?.[0]?.policyRuleId).toBe("sec-base-001");
    expect(merged.results?.[0]?.findings?.[0]?.message).toBe(
      "Public SQL endpoint without private link",
    );
    expect(merged.results?.[0]?.claims).toEqual([]);
    expect(merged.results?.[0]?.evidenceRefs).toEqual([]);
  });

  it("returns buyer summary when findingSummaries are absent", async () => {
    const buyerSummary = buyerSummaryWithoutFindings();
    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummary,
    );

    expect(merged).toBe(buyerSummary);
  });
});
