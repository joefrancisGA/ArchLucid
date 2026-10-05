import { describe, expect, it } from "vitest";

import { dailyMetricAccessibleSummary, dailyMetricValue } from "@/lib/ai-usage-dashboard-formatters";
import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";

const bucket: LlmCostDailyBucket = {
  bucketUtc: "2026-06-01T00:00:00Z",
  estimatedCostUsd: 12.5,
  promptTokens: 100,
  completionTokens: 50,
};

describe("dailyMetricValue", () => {
  it("returns null when cost is not finite", () => {
    expect(
      dailyMetricValue({ ...bucket, estimatedCostUsd: Number.NaN }, "cost"),
    ).toBeNull();
  });

  it("returns numeric token totals when finite", () => {
    expect(dailyMetricValue(bucket, "tokens")).toBe(150);
  });
});

describe("dailyMetricAccessibleSummary", () => {
  it("explains when daily metrics were not returned", () => {
    const summary = dailyMetricAccessibleSummary(
      [{ ...bucket, estimatedCostUsd: Number.NaN }],
      "cost",
      "USD",
    );

    expect(summary).toContain("not returned");
  });
});
