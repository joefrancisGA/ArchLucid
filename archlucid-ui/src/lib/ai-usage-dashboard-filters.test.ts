import { describe, expect, it } from "vitest";

import {
  DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
  parseAiUsageDashboardFilters,
  serializeAiUsageDashboardFilters,
} from "@/lib/ai-usage-dashboard-filters";

describe("ai-usage-dashboard-filters", () => {
  it("parses defaults when search params are empty", () => {
    expect(parseAiUsageDashboardFilters(new URLSearchParams())).toEqual(DEFAULT_AI_USAGE_DASHBOARD_FILTERS);
  });

  it("round-trips non-default filters", () => {
    const filters = {
      ...DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      groupBy: "operation" as const,
      feature: "ReviewAnalysis",
      trigger: "scheduled" as const,
      status: "skipped" as const,
    };

    const params = serializeAiUsageDashboardFilters(filters);
    const parsed = parseAiUsageDashboardFilters(params);

    expect(parsed.groupBy).toBe("operation");
    expect(parsed.feature).toBe("ReviewAnalysis");
    expect(parsed.trigger).toBe("scheduled");
    expect(parsed.status).toBe("skipped");
  });
});
