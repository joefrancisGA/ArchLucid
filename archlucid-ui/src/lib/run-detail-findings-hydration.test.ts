import type { RunDetail } from "@/types/authority";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRunSummary } from "@/lib/api";

import { mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings } from "./run-detail-findings-hydration";

vi.mock("@/lib/api", () => ({
  getRunSummary: vi.fn(),
  getRunDetail: vi.fn(),
}));

const getRunSummaryMock = vi.mocked(getRunSummary);

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
      },
    ],
  };
}

describe("mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings", () => {
  beforeEach(() => {
    getRunSummaryMock.mockReset();
  });

  it("returns buyer summary unchanged when findings and goldenManifestId are already present", async () => {
    const detail: RunDetail = {
      ...operatorDetailWithFindings(),
      run: {
        ...operatorDetailWithFindings().run,
        goldenManifestId: "f0000001-0000-4000-8000-000000000001",
      },
    };

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      detail,
    );

    expect(merged).toBe(detail);
    expect(getRunSummaryMock).not.toHaveBeenCalled();
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

    expect(getRunSummaryMock).not.toHaveBeenCalled();
    expect(merged.results).toHaveLength(1);
    expect(merged.results?.[0]?.findings?.[0]?.policyRuleId).toBe("sec-base-001");
    expect(merged.results?.[0]?.findings?.[0]?.message).toBe(
      "Public SQL endpoint without private link",
    );
  });

  it("fills goldenManifestId from lightweight run summary when buyer omits it", async () => {
    getRunSummaryMock.mockResolvedValue({
      runId: "operator-demo-review-e2e",
      projectId: "33333333-3333-3333-3333-333333333333",
      createdUtc: "2026-06-23T04:00:00.000Z",
      goldenManifestId: "f0000001-0000-4000-8000-000000000001",
    } as Awaited<ReturnType<typeof getRunSummary>>);

    const buyerSummary: RunDetail = {
      run: {
        runId: "operator-demo-review-e2e",
        projectId: "33333333-3333-3333-3333-333333333333",
        createdUtc: "2026-06-23T04:00:00.000Z",
      },
      executionFlavorBuyerSummary: "Policy-aware demo review.",
      findingSummaries: [
        {
          findingId: "demo-finding-1",
          title: "Finding title",
          severity: "Warning",
        },
      ],
    } as RunDetail;

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummary,
    );

    expect(getRunSummaryMock).toHaveBeenCalledWith("operator-demo-review-e2e", undefined);
    expect(merged.run.goldenManifestId).toBe("f0000001-0000-4000-8000-000000000001");
    expect(merged.results).toHaveLength(1);
  });

  it("returns buyer summary when run summary fetch fails", async () => {
    getRunSummaryMock.mockRejectedValue(new Error("upstream unavailable"));

    const buyerSummary: RunDetail = {
      run: {
        runId: "operator-demo-review-e2e",
        projectId: "33333333-3333-3333-3333-333333333333",
        createdUtc: "2026-06-23T04:00:00.000Z",
      },
      executionFlavorBuyerSummary: "Policy-aware demo review.",
    };

    const merged = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      "operator-demo-review-e2e",
      buyerSummary,
    );

    expect(merged).toBe(buyerSummary);
  });
});
