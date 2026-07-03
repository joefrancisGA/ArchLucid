import type { RunDetail } from "@/types/authority";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRunDetail } from "@/lib/api";

import { mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings } from "./run-detail-findings-hydration";

vi.mock("@/lib/api", () => ({
  getRunDetail: vi.fn(),
}));

const getRunDetailMock = vi.mocked(getRunDetail);

function buyerSummaryWithoutFindings(): RunDetail {
  return {
    run: {
      runId: "operator-demo-review-e2e",
      projectId: "33333333-3333-3333-3333-333333333333",
      createdUtc: "2026-06-23T04:00:00.000Z",
      goldenManifestId: "f0000001-0000-4000-8000-000000000001",
      hasGoldenManifest: true,
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
    },
    results: [
      {
        resultId: "r1",
        taskId: "t1",
        runId: "operator-demo-review-e2e",
        agentType: 3,
        findings: [
          {
            findingId: "demo-finding-1",
            message: "Public SQL endpoint without private link",
            category: "Security",
            severity: 3,
            policyRuleId: "sec-base-001",
            reasoningTrace: "Remediate public sql endpoint to satisfy sec-base-001.",
          },
        ],
        confidence: 0.9,
      },
    ],
  };
}

describe("mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings", () => {
  beforeEach(() => {
    getRunDetailMock.mockReset();
  });

  it("returns buyer summary unchanged when findings are already present", async () => {
    const detail = operatorDetailWithFindings();

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      detail,
    );

    expect(merged).toBe(detail);
    expect(getRunDetailMock).not.toHaveBeenCalled();
  });

  it("merges operator results when buyer summary omits findings", async () => {
    getRunDetailMock.mockResolvedValue({
      data: operatorDetailWithFindings(),
      traceId: "trace-1",
    });

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummaryWithoutFindings(),
    );

    expect(getRunDetailMock).toHaveBeenCalledWith("operator-demo-review-e2e", undefined);
    expect(merged.results).toHaveLength(1);
    expect(merged.results?.[0]?.findings?.[0]?.policyRuleId).toBe("sec-base-001");
    expect(merged.executionFlavorBuyerSummary).toBe("Policy-aware demo review.");
  });

  it("returns buyer summary when operator fetch fails", async () => {
    getRunDetailMock.mockRejectedValue(new Error("upstream unavailable"));

    const buyerSummary = buyerSummaryWithoutFindings();
    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummary,
    );

    expect(merged).toBe(buyerSummary);
  });
});
