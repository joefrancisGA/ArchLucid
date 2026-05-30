import { describe, expect, it } from "vitest";

import { buildLlmCostCommandCenterSummary } from "@/lib/llm-cost-command-center-summary";
import { buildMockLlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

describe("buildLlmCostCommandCenterSummary", () => {
  it("returns month totals and top workspace row from dashboard", () => {
    const dashboard = buildMockLlmCostReportingDashboard();
    const summary = buildLlmCostCommandCenterSummary(dashboard);

    expect(summary).not.toBeNull();
    expect(summary!.utcMonthEstimatedUsd).toBeGreaterThan(0);
    expect(summary!.topWorkspaceProjectLabel).toContain("Core workspace");
  });

  it("returns null when dashboard is empty", () => {
    expect(
      buildLlmCostCommandCenterSummary({ daily: [], byWorkspaceProject: [], topRuns: [], currency: "USD", isMocked: false }),
    ).toBeNull();
  });
});
