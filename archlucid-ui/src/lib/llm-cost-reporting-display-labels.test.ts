import { afterEach, describe, expect, it, vi } from "vitest";

import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import {
  formatCostReportingWorkspaceLabel,
  hasLlmUsageInDailyBuckets,
  normalizeLlmCostReportingDashboardForDisplay,
} from "@/lib/llm-cost-reporting-display-labels";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => null,
}));

describe("formatCostReportingWorkspaceLabel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("replaces development default tenant with buyer-facing workspace copy", () => {
    expect(formatCostReportingWorkspaceLabel("Development default tenant")).toBe(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
  });

  it("preserves real workspace names", () => {
    expect(formatCostReportingWorkspaceLabel("Contoso Production")).toBe("Contoso Production");
  });
});

describe("hasLlmUsageInDailyBuckets", () => {
  it("returns false when all buckets are zero", () => {
    expect(
      hasLlmUsageInDailyBuckets([
        {
          bucketUtc: "2026-07-01T00:00:00.000Z",
          estimatedCostUsd: 0,
          promptTokens: 0,
          completionTokens: 0,
        },
      ]),
    ).toBe(false);
  });
});

describe("normalizeLlmCostReportingDashboardForDisplay", () => {
  it("sanitizes workspace names on breakdown rows", () => {
    const dashboard: LlmCostReportingDashboard = {
      daily: [],
      byWorkspaceProject: [
        {
          workspaceId: "ws",
          workspaceName: "Development default tenant",
          projectId: "proj",
          projectName: "Current project",
          estimatedCostUsd: 0,
          promptTokens: 0,
          completionTokens: 0,
        },
      ],
      topRuns: [],
      currency: "USD",
      isMocked: false,
    };

    const normalized = normalizeLlmCostReportingDashboardForDisplay(dashboard);

    expect(normalized.byWorkspaceProject[0]?.workspaceName).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  });
});
