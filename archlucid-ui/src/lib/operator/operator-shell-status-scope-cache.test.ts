import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hydrateOperatorShellStatusCaches } from "@/lib/operator/operator-shell-status-client";
import {
  clearOperatorShellStatusScopeAgnosticCaches,
  OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS,
} from "@/lib/operator/operator-shell-status-scope-cache";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";
import { createOperatorQueryClient, getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

const SCOPE_A: OperatorScopeQueryKey = {
  tenantId: "tenant-a",
  workspaceId: "workspace-a",
  projectId: "project-a",
};

describe("operator-shell-status-scope-cache", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("clears scope-agnostic shell caches when operator scope changes", () => {
    const queryClient = getOperatorQueryClient();

    hydrateOperatorShellStatusCaches(queryClient, SCOPE_A, {
      trialStatus: { status: "Active", daysRemaining: 10 },
      catalogMigration: null,
      llmMonthlyBudgetStatus: null,
      alertsInboxSummary: null,
      usageStatus: null,
      homepageSettings: {
        selectedRunId: "run-from-tenant-a",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: null,
        architectureName: null,
        completedUtc: null,
        isSampleApproved: false,
      },
      stickinessSnapshot: null,
      assignedToMeFindingsCount: null,
      reviewsAwaitingAction: null,
    });

    expect(queryClient.getQueryData(operatorQueryKeys.tenantTrialStatus)).toEqual({
      status: "Active",
      daysRemaining: 10,
    });
    expect(queryClient.getQueryData(operatorQueryKeys.tenantHomepageSettings)?.selectedRunId).toBe(
      "run-from-tenant-a",
    );

    writeOperatorScopeToStorage({
      tenantId: "tenant-b",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "Tenant B",
      projectLabel: "Project B",
    });

    expect(queryClient.getQueryData(operatorQueryKeys.tenantTrialStatus)).toBeUndefined();
    expect(queryClient.getQueryData(operatorQueryKeys.tenantHomepageSettings)).toBeUndefined();
  });

  it("removeQueries targets every scope-agnostic shell-status key", () => {
    const queryClient = createOperatorQueryClient();

    for (const queryKey of OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS) {
      queryClient.setQueryData(queryKey, { marker: queryKey.join("/") });
    }

    clearOperatorShellStatusScopeAgnosticCaches(queryClient);

    for (const queryKey of OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS) {
      expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    }
  });
});
