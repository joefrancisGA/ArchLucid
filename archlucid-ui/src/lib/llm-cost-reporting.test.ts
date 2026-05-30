import { describe, expect, it, vi } from "vitest";

import {
  buildMockLlmCostReportingDashboard,
  fetchLlmCostReportingDashboard,
} from "@/lib/llm-cost-reporting";

describe("llm-cost-reporting", () => {
  it("buildMockLlmCostReportingDashboard returns 30 daily buckets and breakdown rows", () => {
    const dash = buildMockLlmCostReportingDashboard();

    expect(dash.daily.length).toBe(30);
    expect(dash.isMocked).toBe(true);
    expect(dash.byWorkspaceProject.length).toBeGreaterThan(0);
    expect(dash.currency).toBe("USD");
  });

  it("parses tolerant API payloads", async () => {
    const payload = {
      currency: "USD",
      daily: [
        {
          bucketUtc: "2026-05-01T00:00:00.000Z",
          estimatedCostUsd: 12.5,
          promptTokens: 1000,
          completionTokens: 200,
        },
      ],
      byWorkspaceProject: [
        {
          workspaceId: "w1",
          workspaceName: "W",
          projectId: "p1",
          projectName: "P",
          estimatedCostUsd: 99,
          promptTokens: 10,
          completionTokens: 2,
        },
      ],
      topRuns: [
        {
          runId: "abc123",
          estimatedCostUsd: 4.2,
          promptTokens: 100,
          completionTokens: 40,
          llmCallCount: 3,
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const dash = await fetchLlmCostReportingDashboard();

    expect(dash.isMocked).toBe(false);
    expect(dash.daily.length).toBe(1);
    expect(dash.byWorkspaceProject.length).toBe(1);
    expect(dash.topRuns.length).toBe(1);
    expect(dash.byWorkspaceProject[0]?.estimatedCostUsd).toBe(99);
    vi.unstubAllGlobals();
  });

  it("falls back to mock on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 404 })));

    const dash = await fetchLlmCostReportingDashboard();

    expect(dash.isMocked).toBe(true);
    expect(dash.daily.length).toBe(30);
    vi.unstubAllGlobals();
  });
});
